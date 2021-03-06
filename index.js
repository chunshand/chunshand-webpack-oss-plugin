/**
 * webpack 阿里云上传文件
 * 
 */
const PluginName = 'ChunshandWebpackOssPlugin';
let url = require('url');
let OSS = require('ali-oss');
const _ = require("lodash");
// 默认配置参数
let DEFAULT_OPTIONS = {
	// 多账号
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
	// protocol
	protocol: 'http://',
	// 失败重试次数
	retry: 3,
	// 过滤方法 接受的 file参数
	filter: function () {
		return true;
	},
	// 路径
	path: '',
	// 是否开启版本控制
	version: false,
	// 版本号
	versionCode: '',
	// 保留几个版本 version为false 起作用
	retain: 5
};

function log(a, b) {
	// eslint-disable-next-line no-console
	console.log(`[${PluginName}] ${a}`, b);
}
// 版本控制 检测文件是否存在
ChunshandWebpackOssPlugin.isExistObject = async function (name, options = {}) {
	let bool = false;
	try {
		await ChunshandWebpackOssPlugin.prototype.client.head(name, options);
		bool = true;
	} catch (error) {
		if (error.code === 'NoSuchKey') {
			bool = false;
		}
	}
	return bool;
}
// 版本控制
ChunshandWebpackOssPlugin.getBuffer = async function (name) {
	let data = null;
	try {
		let result = await ChunshandWebpackOssPlugin.prototype.client.get(name);
		data = result.content;
	} catch (e) {
		data = null;
	}
	return data;
}
// 版本控制 删除文件
ChunshandWebpackOssPlugin.deletePrefixObject = async function (prefixStr) {
	async function handleDel(name) {
		return await ChunshandWebpackOssPlugin.prototype.client.delete(name);
	}

	// 删除指定前缀的文件。
	async function deletePrefix(prefix) {
		const list = await ChunshandWebpackOssPlugin.prototype.client.list({
			prefix: prefix
		});
		list.objects = list.objects || [];
		let all = list.objects.map((v) => handleDel(v.name));
		return await Promise.all(all);
	}
	return deletePrefix(prefixStr)
}
// 获取版本配置文件
ChunshandWebpackOssPlugin.getVjson = async function (callback) {
	let path = '/' + this.newOptions.offset + 'oss.v.json';
	let bool = await this.isExistObject(path);
	let vdata = [];
	let current = {
		// 版本号
		versionCode: this.newOptions.versionCode,
		// 创建时间
		create_at: Date.parse(new Date()),
		// 项目地址
		path: this.newOptions.offset + this.newOptions.versionCode

	};
	if (bool) {
		// 文件存在 
		vdata = await this.getBuffer(path);
		vdata = JSON.parse(vdata);
		let retain = this.newOptions.retain;
		// 假如在增加一个版本 会不会超出保留版本次数
		if (vdata.length + 1 > retain) {
			// 正序
			vdata.sort(function (a, b) {
				return a.time - b.time;
			})
			// 删除第一个
			let v = vdata.shift();
			await this.deletePrefixObject(v.path + '/');
			let isc = vdata.map((i) => i.versionCode).find((i) => i == current.versionCode);
			console.log(isc);
			if (isc) {
				callback(false);
				return;

			}
			vdata.push(current);


		} else {
			let isc = vdata.map((i) => i.versionCode).find((i) => i == current.versionCode);
			if (isc) {
				callback(false);
				return;
			}
			vdata.push(current);
		}

		this.setVjson(path, vdata);



	} else {
		// 文件不存在 则创建文件
		vdata.push(current);
		this.setVjson(path, vdata);
	}
	callback(vdata);

}/**
 * 设置远端json 版本列表
 * @param {string} path 
 * @param {array} vdata 
 */
ChunshandWebpackOssPlugin.setVjson = function (path, vdata) {
	vdata = JSON.stringify(vdata);
	let body = Buffer.isBuffer(vdata) ? vdata : Buffer.from(vdata);
	new Promise(() => {
		ChunshandWebpackOssPlugin.prototype.client.put(path, body, {
			timeout: 30 * 1000
		}).then(function () {
			log('[SUCCESS]', path);

		}, function (e) {
			log('[ERROR]', e);
		});
	})
}
// 版本控制
ChunshandWebpackOssPlugin.getConfig = function (options) {
	this.newOptions = _.merge(DEFAULT_OPTIONS, options);
	let conf = this.conf = this.newOptions.accountConfig[this.newOptions.account];
	let region = conf.region;
	let remote = conf.remote ? conf.remote : region;
	let publicPath = this.newOptions.protocol + remote;
	let offset = '';
	// 是否开启版本号
	if (this.newOptions.version && this.newOptions.versionCode) {
		publicPath = publicPath + '/' + this.newOptions.path + '/' + this.newOptions.versionCode;
	} else {
		publicPath = publicPath + '/' + this.newOptions.path
	}
	offset = this.newOptions.path;

	this.newOptions.publicPath = publicPath + '/';
	this.newOptions.offset = offset + '/';
	return this.newOptions;
}
/**
 * 初始化
 * @param {object} options webpack配置
 */
function ChunshandWebpackOssPlugin(options) {
	let newOptions = this.newOptions = ChunshandWebpackOssPlugin.getConfig(options);
	let conf = newOptions.accountConfig[newOptions.account];
	ChunshandWebpackOssPlugin.prototype.client = this.client = new OSS({
		region: conf.region,
		accessKeyId: conf.accessKeyId,
		accessKeySecret: conf.accessKeySecret
	});
	this.client.useBucket(conf.bucket);
}

ChunshandWebpackOssPlugin.prototype.apply = function (compiler) {
	compiler.hooks.emit.tapAsync(PluginName, function (compilation, callback) {
		// publicPath
		let publicPath = url.parse(compiler.options.output.publicPath);
		if (!publicPath.protocol || !publicPath.hostname) {
			log('CURRENT : compiler.options.output.publicPath: ', compiler.options.output.publicPath);
			return callback(new Error('Webpack配置文件中: "output.publicPath"必须设置为域名，设置为：远端域名 具体可看阿里云oss后台设置'));
		}
		// 文件列表
		let files = _.filter(_.keys(compilation.assets), ChunshandWebpackOssPlugin.newOptions.filter);
		log("[FILES TOTAL]", files.length)
		if (files.length === 0) {
			// 没有资源文件需要上传
			return callback();
		}
		/**
		 * 上传
		 * @param {object} file 上传文件
		 * @param {number} times 重试次数
		 */
		function upload(file, times) {
			let target = url.resolve(url.format(publicPath), file);
			let key = url.parse(target).pathname;
			let source = compilation.assets[file].source();
			let body = Buffer.isBuffer(source) ? source : Buffer.from(source);
			return ChunshandWebpackOssPlugin.prototype.client.put(key, body, {
				timeout: 30 * 1000
			}).then(function () {
				log('[UPLOAD SUCCESS]', key);
				let next = files.shift();
				if (next) {
					return upload(next, times);
				}
			}, function (e) {
				if (times === 0) {
					throw new Error('[UPLOAD ERROR]: ', e);
				}
				else {
					log('[retry UPLOAD]：', times, key);
					return upload(file, --times);
				}
			});
		}
		function update_run() {
			// 开始上传
			upload(files.shift(), ChunshandWebpackOssPlugin.newOptions.retry).then(function () {
				log("FINISHED", "All Completed");
				callback();
			}).catch(function (e) {
				// 上传失败
				log("FAIL", e);
				return callback(e);
			});
		}
		if (ChunshandWebpackOssPlugin.newOptions.version && ChunshandWebpackOssPlugin.newOptions.versionCode) {
			// 检测以往脚本
			ChunshandWebpackOssPlugin.getVjson(function (e) {
				if (!e) {
					return callback(new Error('线上存在相同版本 请修改版本号 参数[versionCode]'));
				}
				update_run();
			})
		} else {
			update_run();
		}
	});
};

module.exports = ChunshandWebpackOssPlugin;

