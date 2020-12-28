let WebpackOssPlugin = require('../index.js');
let opstion = {
	account: 'default',
	accountConfig: {
		default: {
			accessKeyId: '',
			accessKeySecret: '',
			bucket: '',
			region: '',
			remote: ''
		}
	},
	// 以上是 aliyun oss 配置

	// 失败重试次数
	retry: 3,
	// 过滤方法 接受的 file参数
	filter: function (file) {
		return true;
	},
	// 是否开启版本控制
	// 路径
	path: 'web/test',
	version: true,
	versionCode: 'v4',
	retain: 2
};

let nconfig = WebpackOssPlugin.getConfig(opstion);
WebpackOssPlugin(nconfig);

WebpackOssPlugin.getVjson(function (e) {
	console.log(e);
})