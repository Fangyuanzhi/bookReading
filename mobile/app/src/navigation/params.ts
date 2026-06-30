export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  BookDetail: { bookId: string };
  Reader: { chapterId: string; bookTitle?: string };
  UserProfile: { userId: string };
  FollowList: { userId: string; type: 'followers' | 'following' };
  MyNotes: undefined;
  MyReviews: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Shelf: undefined;
  Discover: undefined;
  Profile: undefined;
};
