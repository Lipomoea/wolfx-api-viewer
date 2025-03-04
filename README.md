# wolfx-api-viewer
> [!TIP]
> 此分支是稳定而非最新的分支。如需同步最新进度，请切换至其他分支（通常是dev或test分支）。
## 简介
wolfx-api-viewer(WAV)是一个基于[Wolfx Open API](https://wolfx.jp/apidoc)以及其他API制作的地震预警和地震信息可视化Web应用，基于Vite+Vue3+Leaflet开发。  
现已提供基于Tauri构建的Windows应用程序，推荐Windows 10及以上系统使用。  
* [Web稳定版](http://124.70.142.213:8080/)
* [Web开发版](http://124.70.142.213:8081/)
* [Windows应用程序下载](https://github.com/Lipomoea/wolfx-api-viewer/releases)
## 主要功能  
* 接收日本气象厅、台湾省中央气象署、四川省地震局、福建省地震局地震预警信息。
* 接收日本气象厅、中国地震台网地震信息。
* 获取NIED強震モニタ测站数据。
## 注意事项
* 使用本网页前，请详细阅读网页“设置”-“帮助&关于”中的内容。
* 此应用不属于Wolfx Project，相关问题请勿咨询Wolfx Project。
## 数据来源
* 地震预警、地震信息（除JMA地震情报）、IP定位：[Wolfx Open API](https://wolfx.jp/apidoc)
* 地震信息（JMA地震情报）：[P2PQuake](https://www.p2pquake.net/develop/json_api_v2/#/P2P%E5%9C%B0%E9%9C%87%E6%83%85%E5%A0%B1%20API/get_history)
* 強震モニタ震度数据：[Yahoo!天気・災害](https://typhoon.yahoo.co.jp/weather/jp/earthquake/kyoshin/)
* 中国地图：[阿里云DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector)
* 中国断层：[国家地震科学数据中心](https://data.earthquake.cn/datashare/report.shtml?PAGEID=datasourcelist&dt=ff808082845b8fd401845bf036a1000c)
* 日本地图：[日本気象庁](https://www.data.jma.go.jp/developer/gis.html)
* 世界地图：[GeoJSON Maps of the globe](https://geojson-maps.kyd.au/)
* SREV音效：[scratch-realtime-earthquake-viewer-page](https://github.com/kotoho7/scratch-realtime-earthquake-viewer-page)
* NTP时间：[WorldTimeAPI](https://www.worldtimeapi.org/)
## 参考软件
* [JQuake](https://jquake.net/)
* [scratch-realtime-earthquake-viewer-page](https://github.com/kotoho7/scratch-realtime-earthquake-viewer-page)
* [TREM-Lite](https://github.com/ExpTechTW/TREM-Lite)
## 特别鸣谢
* [Wolfx Project](https://wolfx.jp/)
* [TBS](https://space.bilibili.com/652050915/)
* [FAN](https://www.fanstudio.tech/)
* Dxr (QQ: 2194362576)
* HomoOS
* [azzbm](https://space.bilibili.com/702013828)
* [不知道要取什么系列](https://space.bilibili.com/499911115)
* 各位提供帮助的EEW爱好者
## 版权声明
本项目参考了以下项目的源代码。
* [TREM-Lite](https://github.com/ExpTechTW/TREM-Lite)
* [TREM-tauri](https://github.com/ExpTechTW/TREM-tauri)
* [EarthQuakeWarning](https://github.com/kengwang/EarthQuakeWarning)
* [Zero-Quake](https://github.com/0Quake/Zero-Quake)
## 开放源代码许可
本项目基于[AGPL-3.0](https://github.com/Lipomoea/wolfx-api-viewer/blob/main/LICENSE)协议授权。
