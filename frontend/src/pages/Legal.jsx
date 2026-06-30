import { APP_CLASSES, APP_NAME, APP_TAGLINE, APP_TYPE } from '../styles/theme';

export default function Legal() {
  return (
    <div className="flex flex-col gap-6">
      <header className={`${APP_CLASSES.card} p-6`}>
        <p className={`${APP_TYPE.label} mb-2`}>{APP_NAME}</p>
        <h1 className={`${APP_TYPE.display} text-gray-900 mb-4`}>内容合规与避风港说明</h1>
        <p className={`${APP_TYPE.body} text-gray-500`}>
          {APP_NAME}是{APP_TAGLINE}社区。我们尊重版权，并依据避风港原则处理用户举报。
        </p>
      </header>

      <section className={`${APP_CLASSES.card} p-6 space-y-4`}>
        <h2 className={APP_TYPE.title}>举报入口</h2>
        <p className={`${APP_TYPE.body} text-gray-600`}>
          在阅读页、书籍详情页可对书籍、段评、书评发起举报。登录后即可使用「举报」按钮，选择原因并补充说明。
        </p>
      </section>

      <section className={`${APP_CLASSES.card} p-6 space-y-4`}>
        <h2 className={APP_TYPE.title}>处理流程</h2>
        <ul className={`${APP_TYPE.body} text-gray-600 space-y-2 list-disc pl-5`}>
          <li>收到举报后记录并进入待处理队列。</li>
          <li>同一内容累计有效举报达阈值时，系统将自动下架或删除该内容。</li>
          <li>侵权类举报优先处理；必要时联系上传者核实来源与授权。</li>
        </ul>
      </section>

      <section className={`${APP_CLASSES.card} p-6 space-y-4`}>
        <h2 className={APP_TYPE.title}>用户责任</h2>
        <p className={`${APP_TYPE.body} text-gray-600`}>
          请勿上传、发布侵犯他人著作权或含有违法不良信息的内容。公版与自有版权内容请在上传时注明来源与许可说明。
        </p>
      </section>

      <section className={`${APP_CLASSES.card} p-6 space-y-4`}>
        <h2 className={APP_TYPE.title}>联系我们</h2>
        <p className={`${APP_TYPE.body} text-gray-600`}>
          如需人工申诉或版权合作，请通过你注册账号所绑定的渠道联系平台管理员。
        </p>
      </section>

      <p className={`${APP_TYPE.caption} text-center`}>
        <a href="/privacy" className="text-blue-600 hover:underline">
          隐私政策
        </a>
      </p>
    </div>
  );
}
