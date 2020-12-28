## chunshand-webpack-oss-plugin

前端的项目编译后上传cdn 所以就写了个插件


### 安装

```
	npm i -D chunshand-webpack-oss-plugin
```

### 配置

```javascript
// 默认配置参数
 {
	// 当前账号
	account: 'default',
	accountConfig: {
		default: {
			accessKeyId: '',
			accessKeySecret: '',
			bucket: '',
			// oss 区域
			region: '',
			// 远端地址 具体可看后台管理的设置
			remote: ''
		}
	},
	protocol: 'http://',
	// 上传失败重试次数 
	retry: 3,
	// 过滤方法 方法就一个参数 文件名 
	filter: function () {
		return true;
	},
	// 文件前缀
	path: '',
	// 是否版本控制 
	version: false,
	// 当前版本号
	versionCode: '',
	// 保留版本个数
	retain: 5 
}

```

### 使用

注意 `version` 为 `true` 的时候 `versionCode` `retain` 才会起作用

方法
 
```javascript
const ChunshandWebpackOssPlugin = require("chunshand-webpack-oss-plugin");
const ossUploadConfig = ChunshandWebpackOssPlugin.getConfig({
	// 配置 
	// 建议存在本地 或 获取环境变量
});



{	
// publicPath
publicPath:ossUploadConfig.publicPath,
// plugin
plugin:[new ChunshandWebpackOssPlugin(ossUploadConfig)]
}
	


// publicPath = protocol + remote?remote:region + path + filepath


```

## 多版本控制

```javascript
{
	// 是否版本控制 
	version: true,
	// 当前版本号
	versionCode: 'v1.0.1',
	// 保留版本个数
	retain: 5
}

```

 - 每一次需要打包到线上都要更改 `versionCode`
 - 自动会 `path` 目录下创建 `oss.v.json` 记录版本 尽量不要动

线上目录目录结构

```
-----------
path/
	--oss.v.json
	--v1.0.1/
	--v1.0.3/
	...
-----------
```

检测到当前版本号 线上的oss.v.json也存在相同版本时 不会覆盖 会停止 并报错

当 `oss.v.json` 内的数量超过了`retain`数量 则会删除多余版本文件

版本号 可以使用时间格式 或者 获取 `package.json` 版本号


