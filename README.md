# 要石 kanameishi

## 简介
要石(kanameishi)是一个基于多重API制作的地震预警和地震信息可视化Web应用，基于Vite+Vue3+Leaflet开发。  
提供基于Tauri构建的Windows及macOS应用程序，推荐Windows 10、macOS 11 (arm64) 及以上系统使用。  
icon是《铃芽之旅》的草太さん（椅子形态）。  
* [Web版](https://kanameishi.lipomoea.tech/)
* [Web版备用](https://kanameishi.pages.dev/)（使用CloudFlare托管，速度更快，但国内可能需要代理访问。）
* [应用程序下载](https://github.com/Lipomoea/kanameishi/releases)
* [应用程序下载（备用）](https://gitee.com/lipomoea/kanameishi/releases)
* [开发者bilibili](https://space.bilibili.com/316757498)
## 主要功能  
* 接收中国地震局（包括各省分局）、台湾省中央气象署、日本气象厅地震预警速报。
* 接收中国地震台网、台湾省中央气象署、日本气象厅地震信息。
* 接收日本气象厅海啸情报。
* 获取NIED強震モニタ、KMA-PEWS测站数据并检测。
## 注意事项
* 本应用程序使用的数据源均为非官方数据源，本应用程序仅作为学习使用。
* 本应用程序为永久免费的不盈利项目，任何以本应用程序为名义索取费用的行为均属诈骗。
* 使用本应用程序前，请详细阅读网页“设置”-“帮助&关于”中的内容。
## 数据来源
* 地震预警（CEA/SC/FJ/CWA/JMA）、地震信息（CENC）、地震列表（JMA）、IP定位：[Wolfx Open API](https://wolfx.jp/apidoc)（请注意参考接口文档）
* 地震信息（JMA）、海啸信息（JMA）：[P2PQuake](https://www.p2pquake.net/develop/json_api_v2/#/P2P%E5%9C%B0%E9%9C%87%E6%83%85%E5%A0%B1%20API/get_history)
* 地震预警（CEA/SC/FJ/CWA/JMA）、地震信息（CENC/CWA/USGS/FSSN）、地震列表（CENC/FSSN）、NTP时间：[FAN Studio API](https://api.fanstudio.tech)
* 中国大陆地图：[阿里云DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector)
* 中国台湾地图：[GeoJSON](https://geojson.cn/)
* 中国断层：[国家地震科学数据中心](https://data.earthquake.cn/datashare/report.shtml?PAGEID=datasourcelist&dt=ff808082845b8fd401845bf036a1000c)
* 中国地图注记：[中国城市经纬度坐标点集](https://gitcode.com/Open-source-documentation-tutorial/a0d83)
* 日本地图：[日本気象庁](https://www.data.jma.go.jp/developer/gis.html)（注意钓鱼岛地区处理）
* 韩国地图：[NGII](https://www.ngii.go.kr/world/mapdownload05_en.html)
* 世界地图：[GeoJSON Maps of the globe](https://geojson-maps.kyd.au/)（注意甄别争议地区）
* SREV音效：[scratch-realtime-earthquake-viewer-page](https://github.com/kotoho7/scratch-realtime-earthquake-viewer-page)
* 中文倒计时播报素材：[地牛Wake Up！](https://eew.earthquake.tw/)
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
* [Andyli](https://space.bilibili.com/401770455)
* [PopSlime](https://github.com/PopSlime)
* 各位提供帮助的EEW爱好者
## 版权声明
本项目参考了以下项目的源代码。
* [TREM-Lite](https://github.com/ExpTechTW/TREM-Lite)
* [TREM-tauri](https://github.com/ExpTechTW/TREM-tauri)
* [EarthQuakeWarning](https://github.com/kengwang/EarthQuakeWarning)
* [Zero-Quake](https://github.com/0Quake/Zero-Quake)
## 开放源代码许可
本项目基于[AGPL-3.0](https://github.com/Lipomoea/kanameishi/blob/main/LICENSE)协议授权。
