import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[读书会] 页面渲染异常', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={`${APP_CLASSES.page} flex items-center justify-center px-6`}>
        <div className={`${APP_CLASSES.card} max-w-md w-full p-8 text-center`}>
          <p className={`${APP_TYPE.title} text-gray-900 mb-2`}>页面出现问题</p>
          <p className={`${APP_TYPE.body} text-gray-500 mb-6`}>
            加载或渲染时发生错误，请返回首页继续浏览。
          </p>
          <Link to="/" className={APP_CLASSES.btnPrimary}>
            返回首页
          </Link>
        </div>
      </div>
    );
  }
}
