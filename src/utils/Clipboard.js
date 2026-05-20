import { isTauri } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
// Clipboard.js为防止safari特定版本复制问题而写
const copyByTextarea = text => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();

    if(range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
    if(!copied) throw new Error('execCommand copy failed');
};

export const copyText = async value => {
    const text = String(value ?? '');
    const errors = [];

    if(isTauri()) {
        try {
            await writeText(text);
            return;
        } catch (error) {
            errors.push(error);
        }
    }

    if(typeof navigator !== 'undefined' && typeof window !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (error) {
            errors.push(error);
        }
    }

    // 浏览器剪贴板常被权限卡住，最后走textarea
    try {
        copyByTextarea(text);
        return;
    } catch (error) {
        errors.push(error);
    }

    throw errors[errors.length - 1] || new Error('copy failed');
};
