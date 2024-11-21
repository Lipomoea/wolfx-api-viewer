# wolfx-api-viewer
> [!WARNING]
> 此分支不是最新分支，请切换至最新分支（通常是test结尾的分支或dev分支，分支进度*-test>dev>main）

wolfx-api-viewer是一个基于[Wolfx Open API](https://wolfx.jp/apidoc)以及其他API制作的地震预警和地震信息可视化Web应用，基于Vite+Vue3+Leaflet开发。  
现已提供基于Tauri构建的Windows应用程序，推荐Windows 10及以上系统使用。  
* [Web应用链接](http://124.70.142.213:8081/) 
* [Windows应用程序下载](https://github.com/Lipomoea/wolfx-api-viewer/releases)
## 主要功能  
* 接收日本气象厅、台湾省中央气象署、四川省地震局、福建省地震局地震预警信息。
* 接收日本气象厅、中国地震台网地震信息。
* 获取NIED強震モニタ测站数据。
## 注意事项
* 使用本网页前，请详细阅读网页“设置”-“帮助&关于”中的内容。
* 此应用不属于Wolfx，相关问题请勿咨询Wolfx。
## 数据来源
* 地震预警、地震信息、IP定位：[Wolfx Open API](https://wolfx.jp/apidoc)
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
* Wolfx Project
* 各位提供帮助的EEW爱好者
