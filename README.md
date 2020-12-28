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
});



{	
	// publicPath
	publicPath:ossUploadConfig.publicPath,
	// plugin
	plugin:[new ChunshandWebpackOssPlugin(ossUploadConfig)]
}
	


// publicPath = protocol + remote?remote:region + path + filepath


```

