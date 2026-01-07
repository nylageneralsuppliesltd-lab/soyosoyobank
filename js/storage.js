// js/storage.js
const STORAGE_KEY = 'soyoMembers';

export function loadMembers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveMembers(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}
