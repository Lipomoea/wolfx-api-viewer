<template>
    <div class="outer">
        <div class="container">
            <div class="title">最近更新</div>
            <div class="about">
                <p>v1.1.2 优化：使用时间服务器进行对时以降低本地时间不准带来的影响；修复：JMA远地地震情报深度显示错误的问题。</p>
                <p>v1.1.1 修复：自动打开地图功能的重大bug；修复：国内EEW错误采用日本时区计算地震波的问题；修复：地图兼容JMA震度速报；优化：轻微调整地图左上角信息框样式。</p>
                <p>v1.1.0-1 优化：提高部分代码鲁棒性；优化：轻微调整设置组件样式。</p>
                <p>v1.1.0 新增：支持设置用户所在地；新增：支持IP自动设置所在地；新增：地震波抵达倒计时功能；优化：部分代码逻辑。</p>
                <p>v1.0.0 - 1.0.4 新增：地图功能、自动打开地图功能、JMA地震情报列表查看详细；优化：设置组件样式重排。</p>
            </div>
            <div class="title">使用方法</div>
            <div class="about">
                <p>主要功能：接收日本气象厅、台湾省中央气象署、四川省地震局、福建省地震局地震预警信息以及日本气象厅、中国地震台网地震测定信息。点击任一模块打开地图，“地震信息”地图右上角可跳转查看历史地震，其中日本气象厅地震情报支持点击跳转详情。</p>
                <p>通知推送：本网页支持地震信息推送功能（仅Windows端经过测试，需授予通知权限）。出于安全性考虑，现代浏览器对于无域名网站默认采取保护措施，无法授予通知权限。如您确需此功能且充分信赖本页面，请自行搜索解决方案。由此导致的一切后果请自行承担。Chrome浏览器参考：<a href="https://tieba.baidu.com/p/7526026826" target="_blank">https://tieba.baidu.com/p/7526026826</a></p>
                <p>播放声音：收到地震信息时播放对应音效。此功能需要开启网页声音权限，否则声音播放可能失效。Chrome：点击网页链接左侧按钮-网站设置-声音-允许，重新加载页面。若无法授予权限参照上一条。</p>
                <p>作为Chrome应用安装：Chrome打开此页面，右上角三点-保存并分享-将网页作为应用安装。安装一次后刷新页面即可加载最新版本网页，无需重新安装。</p>
            </div>
            <div class="title">注意事项</div>
            <div class="about">
                <p>关于烈度：日本气象厅、台湾省中央气象署资料采用震度制，四川省地震局、福建省地震局、中国地震台网资料采用CSIS烈度制。不同烈度制数值不可直接比较，不同烈度制对应配色逻辑不同。除日本气象厅地震情报外所有烈度数值均为估计值，不代表真实烈度。</p>
                <p>关于时间：所有时间均展示发报机构当地时间，例如日本气象厅资料显示时间为JST (UTC+9) ，其余资料显示时间为CST (UTC+8) 。“经过时间”计算的是发震时间（日本气象厅地震情报为检知时间）至今经过的时间。计算机本地时间不准确可能影响页面显示。</p>
                <p>关于延迟：受API限制，部分资料具有延迟是正常现象。</p>
                <p>关于音效：Scratch Realtime Earthquake Viewer (SREV) 音效由SREV作者基于Scratch素材加工，遵循<a href="https://creativecommons.org/licenses/by-sa/2.0/deed.zh-hans" target="_blank">CC BY-SA 2.0 DEED</a>许可协议，本网页未进行二次加工。</p>
                <p>关于走时：目前所有地震预警的地震波位置均采用jma2001走时表计算，对日本以外地区可能有较大误差。未知震源深度视为0km。</p>
                <p>关于地图：由于服务器带宽限制，进入页面后可能需要一定时间加载地图。如果长时间未加载地图，请刷新页面。</p>
            </div>
            <div class="title">关于</div>
            <div class="about">
                <p>本页面基于Wolfx Open API (<a href="https://api.wolfx.jp" target="_blank">api.wolfx.jp</a>) 开发，不属于Wolfx官方，与本网页相关的问题请勿咨询Wolfx官方。特别感谢Wolfx Project提供接口支持。</p>
                <p>本页面为个人基于兴趣爱好开发，无任何形式的盈利行为，仅供学习交流使用，无法保证正常维护。</p>
                <p>作为个人实验性质作品，本网页没有（也不会有）域名，且可能在服务器到期后停止运行。</p>
                <p>本页面未针对移动端进行适配，建议使用电脑端浏览器访问本网页。</p>
                <p>联系我：<a href="https://space.bilibili.com/316757498" target="_blank">リッポミャ</a>（哔哩哔哩）</p>
                <p>Github: <a href="https://github.com/Lipomoea/wolfx-api-viewer" target="_blank">https://github.com/Lipomoea/wolfx-api-viewer</a></p>
            </div>
        </div>
    </div>
</template>

<script setup>

</script>

<style lang="scss" scoped>
a,a:visited{
    color: blue
}
.outer{
    width: 100%;
    .container{
        border: black 1px solid;
        border-radius: 10px;
        padding: 15px;
        margin: 0px 20px 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        .title{
            font-size: 24px;
            font-weight: 700;
        }
    }
}
</style>