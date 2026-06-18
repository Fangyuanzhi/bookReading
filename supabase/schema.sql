-- ============================================================
-- 陪读 · 氛围陪伴式社交共读社区
-- Supabase / Postgres 数据库 schema (MVP)
-- 用法：粘到 Supabase 控制台 → SQL Editor → 执行。
-- 已启用 RLS（行级安全），适配面向公众的多租户场景。
-- ============================================================

create extension if not exists "pgcrypto";   -- 提供 gen_random_uuid()

-- ------------------------------------------------------------
-- 1. 用户资料 profiles（镜像 auth.users，存放公开信息）
-- ------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- 注册时自动建一条 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', '读者'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. 书 books
-- ------------------------------------------------------------
create type book_source as enum ('public_domain', 'original', 'licensed');
create type book_status as enum ('draft', 'published', 'removed');

create table public.books (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  author       text,
  cover_url    text,
  description  text,
  language     text default 'zh',
  source       book_source not null default 'public_domain',
  status       book_status not null default 'published',
  epub_path    text,                 -- Supabase Storage 中的 EPUB 路径
  license_note text,                 -- 版权/授权说明（公版来源 / 原创 / 授权方）
  created_by   uuid references public.profiles(id) on delete set null,  -- UGC 作者
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. 章节 chapters（对应 EPUB 的 spine/TOC，用于“N人在读这一章”和章末书评）
-- ------------------------------------------------------------
create table public.chapters (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books(id) on delete cascade,
  idx         int  not null,         -- 章节顺序
  title       text,
  href        text,                  -- EPUB 内 spine item 的 href
  created_at  timestamptz not null default now(),
  unique (book_id, idx)
);

-- ------------------------------------------------------------
-- 4. 段评 / 划线想法 notes  ★核心表★
--    用 EPUB CFI 把想法锚定到精确的文字位置
-- ------------------------------------------------------------
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books(id) on delete cascade,
  chapter_id  uuid references public.chapters(id) on delete set null,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  cfi         text not null,         -- EPUB CFI 区间 = 锚点（核心）
  text_quote  text,                  -- 被划选的原文（展示用 + CFI 失效时兜底定位）
  body        text not null,         -- 用户写的想法
  is_public   boolean not null default true,  -- 公开想法 vs 私人笔记
  parent_id   uuid references public.notes(id) on delete cascade,  -- 盖楼/回复
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index notes_chapter_idx on public.notes (chapter_id) where is_public;
create index notes_book_idx    on public.notes (book_id)    where is_public;
create index notes_user_idx    on public.notes (user_id);

-- 5. 想法点亮 note_likes
create table public.note_likes (
  note_id    uuid references public.notes(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

-- ------------------------------------------------------------
-- 6. 书评 / 章末感想 reviews（chapter_id 为空 = 整本书评）
-- ------------------------------------------------------------
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references public.books(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index reviews_book_idx on public.reviews (book_id);

create table public.review_likes (
  review_id  uuid references public.reviews(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ------------------------------------------------------------
-- 7. 阅读进度 reading_progress（“继续阅读” + 可作为在场的数据来源）
-- ------------------------------------------------------------
create table public.reading_progress (
  user_id    uuid references public.profiles(id) on delete cascade,
  book_id    uuid references public.books(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  cfi        text,                  -- 最后阅读位置
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- ------------------------------------------------------------
-- 8. 共读小组 reading_groups（可后置，先留骨架）
-- ------------------------------------------------------------
create table public.reading_groups (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books(id) on delete cascade,
  name        text not null,
  description text,
  pace        jsonb,                -- 共读节奏/计划
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create table public.group_members (
  group_id  uuid references public.reading_groups(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ============================================================
-- RLS（行级安全）—— 面向公众必开
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.books            enable row level security;
alter table public.chapters         enable row level security;
alter table public.notes            enable row level security;
alter table public.note_likes       enable row level security;
alter table public.reviews          enable row level security;
alter table public.review_likes     enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_groups   enable row level security;
alter table public.group_members    enable row level security;

-- profiles：公开可读；本人可改
create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- books：已发布人人可读；作者管理自己的
create policy "books readable" on public.books for select
  using (status = 'published' or created_by = auth.uid());
create policy "books author insert" on public.books for insert
  with check (created_by = auth.uid());
create policy "books author update" on public.books for update
  using (created_by = auth.uid());

-- chapters：随其所属书可读
create policy "chapters readable" on public.chapters for select using (
  exists (
    select 1 from public.books b
    where b.id = book_id and (b.status = 'published' or b.created_by = auth.uid())
  )
);

-- notes：公开想法人人可读；私人笔记仅本人；本人增/改/删
create policy "notes readable" on public.notes for select
  using (is_public or user_id = auth.uid());
create policy "notes insert self" on public.notes for insert
  with check (user_id = auth.uid());
create policy "notes update own" on public.notes for update
  using (user_id = auth.uid());
create policy "notes delete own" on public.notes for delete
  using (user_id = auth.uid());

-- note_likes：可读；本人增/删
create policy "note_likes readable" on public.note_likes for select using (true);
create policy "note_likes insert self" on public.note_likes for insert with check (user_id = auth.uid());
create policy "note_likes delete self" on public.note_likes for delete using (user_id = auth.uid());

-- reviews
create policy "reviews readable" on public.reviews for select using (true);
create policy "reviews insert self" on public.reviews for insert with check (user_id = auth.uid());
create policy "reviews update own" on public.reviews for update using (user_id = auth.uid());
create policy "reviews delete own" on public.reviews for delete using (user_id = auth.uid());

create policy "review_likes readable" on public.review_likes for select using (true);
create policy "review_likes insert self" on public.review_likes for insert with check (user_id = auth.uid());
create policy "review_likes delete self" on public.review_likes for delete using (user_id = auth.uid());

-- reading_progress：仅本人可读写
create policy "progress own" on public.reading_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- groups：可读；本人创建/加入/退出
create policy "groups readable" on public.reading_groups for select using (true);
create policy "groups insert self" on public.reading_groups for insert with check (created_by = auth.uid());
create policy "members readable" on public.group_members for select using (true);
create policy "members join self" on public.group_members for insert with check (user_id = auth.uid());
create policy "members leave self" on public.group_members for delete using (user_id = auth.uid());

-- ============================================================
-- 实时订阅：新段评 / 书评 / 点亮 实时出现在同章读者眼前
-- ============================================================
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.note_likes;

-- ============================================================
-- 在场（“此刻 N 人在读这一章”）—— 不建表！
-- 用 Supabase Realtime Presence：
--   客户端 join 频道 `chapter:{chapter_id}`，track { user_id, display_name, cursor_cfi }。
--   在场是临时状态，靠频道广播，不落库。
--   “N 人在读” = 该频道当前 presence 成员数。
-- ============================================================

-- ------------------------------------------------------------
-- 示例：导入一本公版书（演示用，正式可由后台脚本批量导入）
-- ------------------------------------------------------------
-- insert into public.books (title, author, source, language, epub_path, license_note)
-- values ('夜行书简（示例）', '佚名', 'public_domain', 'zh',
--         'books/yexing-shujian.epub', '公有领域 / 占位示例文本');
