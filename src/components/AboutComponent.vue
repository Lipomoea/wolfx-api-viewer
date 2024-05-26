<template>
    <div class="outer">
        <div class="container">
            <div class="title">使用方法</div>
            <div class="about">
                <p>主要功能：接收日本气象厅、台湾省中央气象署、四川省地震局、福建省地震局地震预警信息以及日本气象厅、中国地震台网地震测定信息。可点击“地震信息”中的任一模块查看历史地震。</p>
                <p>通知推送：本网页支持地震信息推送功能（仅Windows端经过测试，需授予通知权限）。出于安全性考虑，现代浏览器对于无域名网站默认采取保护措施，无法授予通知权限。如您确需此功能且充分信赖本页面，请自行搜索解决方案。由此导致的一切后果请自行承担。Chrome浏览器参考：<a href="https://tieba.baidu.com/p/7526026826" target="_blank">https://tieba.baidu.com/p/7526026826</a></p>
                <p>作为Chrome应用安装：Chrome打开此页面，右上角三点-保存并分享-将网页作为应用安装。</p>
            </div>
            <div class="title">注意事项</div>
            <div class="about">
                <p>1. 关于烈度：日本气象厅、台湾省中央气象署资料采用震度制，四川省地震局、福建省地震局、中国地震台网资料采用CSIS烈度制。不同烈度制数值不可直接比较，不同烈度制对应配色逻辑不同。除日本气象厅地震情报外所有烈度数值均为估计值，不代表真实烈度。</p>
                <p>2. 关于时间：所有时间均展示发报机构当地时间，例如日本气象厅资料显示时间为JST (UTC+9) ，其余资料显示时间为CST (UTC+8) 。“经过时间”计算的是发震时间（日本气象厅地震情报为检知时间）至今经过的时间。本页面计算时间均采用计算机本地时间，如本地时间不准确可能影响页面显示。</p>
                <p>3. 关于连接：除台湾省中央气象署资料均采用WebSocket+每30秒一次GET方法（保证WebSocket连接断开时资料延迟不至于过大）连接。通常情况下WebSocket会在断连数秒后自动重连，如长时间无法重连成功，请刷新页面或关闭网页并等待一段时间再试。台湾省中央气象署资料采用1秒1次GET方法连接，仅可在大陆访问。</p>
                <p>4. 关于延迟：受API限制，部分资料具有延迟是正常现象。</p>
            </div>
            <div class="title">关于</div>
            <div class="about">
                <p>本页面基于Wolfx Open API (<a href="https://api.wolfx.jp" target="_blank">api.wolfx.jp</a>) 开发，不属于Wolfx官方，与本网页相关的问题请勿咨询Wolfx官方。特别感谢Wolfx Project提供接口支持。</p>
                <p>本页面为个人基于兴趣爱好开发，无任何形式的盈利行为，仅供学习交流使用，无法保证正常维护。</p>
                <p>作为个人实验性质作品，本网页没有（也不会有）域名，且可能在服务器到期后停止运行。</p>
                <p>本页面未针对移动端进行适配，建议使用电脑端浏览器访问本网页。</p>
                <p>联系我：<a href="https://space.bilibili.com/316757498" target="_blank">リッポミャ</a>（哔哩哔哩）</p>
                <p>Github: <a href="https://github.com/Lipomoea/wolfx-api-viewer" target="_blank">https://github.com/Lipomoea/wolfx-api-viewer</a></p>
                <p>上次维护：2024.5.26</p>
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