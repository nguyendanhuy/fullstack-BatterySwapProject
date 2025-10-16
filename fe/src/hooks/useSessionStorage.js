import { useState, useEffect, useRef } from 'react';



export function useSessionStorage(key, initialValue) {
    const isFirstRender = useRef(true); //object có dạng current : true //không bị reset khi re-render
    const [storedValue, setStoredValue] = useState(() => {
        try {
            console.log("Đang đọc từ sessionStorage");
            const raw = sessionStorage.getItem(key);
            return raw != null ? JSON.parse(raw) : initialValue;
        } catch (error) {
            console.error("Error reading sessionStorage key “" + key + "”: ", error);
            return initialValue;
        }

    });
    useEffect(() => {
        //bỏ qua lần đầu mount, vì gọi để đọc dữ liệu cũ ra
        if (isFirstRender.current) {
            console.log("Bỏ qua ghi vào session lần đầu");
            isFirstRender.current = false;
            return;
        }
        sessionStorage.setItem(key, JSON.stringify(storedValue));
        console.log("==> Ghi sessionStorage");

    }, [key, storedValue]);
    return [storedValue, setStoredValue];
}