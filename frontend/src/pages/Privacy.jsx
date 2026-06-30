import { Link } from 'react-router-dom';
import { APP_CLASSES, APP_NAME, APP_TYPE } from '../styles/theme';

const SECTIONS = [
  {
    title: '我们收集的信息',
    items: [
      '账号信息：注册邮箱、昵称、头像（可选）',
      '用户内容：段评、章末书评、私人笔记、原创章节、书架与阅读进度',
      '设备与日志：设备型号、系统版本、崩溃日志（用于改进稳定性）',
      '使用数据：阅读进度、功能使用频次（用于继续阅读等核心功能）',
    ],
  },
  {
    title: '信息的使用目的',
    items: [
      '提供阅读、段评、在场、书架、社交等核心服务',
      '账号安全与身份验证',
      '匿名统计分析与产品改进',
      '响应举报、执行避风港合规流程',
      '可选通知：新段评、关注动态（可在设置中关闭）',
    ],
  },
  {
    title: '信息的共享',
    body: '我们不会出售您的个人信息。仅在云服务托管、法律要求或防止欺诈滥用时，与受约束的服务提供商共享必要数据。私人笔记不会向其他用户公开。',
  },
  {
    title: '您的权利',
    items: [
      '查询与更正个人资料（个人主页）',
      '删除段评、书评等用户内容',
      '注销账号（联系 support@peidu.app）',
      '关闭可选通知；退出登录可清除本地缓存',
    ],
  },
  {
    title: '未成年人',
    body: `${APP_NAME}面向年满 16 周岁的用户。我们不会故意收集未成年人的个人信息。`,
  },
  {
    title: '联系我们',
    body: '隐私与账号：support@peidu.app · 合规与版权：legal@peidu.app',
  },
];

export default function Privacy() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header className={`${APP_CLASSES.card} p-6`}>
        <p className={`${APP_TYPE.label} mb-2`}>{APP_NAME}</p>
        <h1 className={`${APP_TYPE.display} text-gray-900 mb-4`}>隐私政策</h1>
        <p className={`${APP_TYPE.body} text-gray-500`}>
          生效日期：2026年6月26日 · 最近更新：2026年6月26日
        </p>
        <p className={`${APP_TYPE.body} text-gray-600 mt-4`}>
          {APP_NAME}重视您的隐私。使用本服务即表示您同意本政策。
          完整版见{' '}
          <a
            className="text-blue-600 hover:underline"
            href="https://github.com/peidu/bookReading/blob/main/mobile/store-listing/privacy-policy.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            仓库文档
          </a>
          。
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className={`${APP_CLASSES.card} p-6 space-y-4`}>
          <h2 className={APP_TYPE.title}>{section.title}</h2>
          {section.body && (
            <p className={`${APP_TYPE.body} text-gray-600`}>{section.body}</p>
          )}
          {section.items && (
            <ul className={`${APP_TYPE.body} text-gray-600 space-y-2 list-disc pl-5`}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className={`${APP_TYPE.caption} text-center pb-8`}>
        <Link to="/legal" className="text-blue-600 hover:underline">
          内容合规与避风港说明
        </Link>
      </p>
    </div>
  );
}
