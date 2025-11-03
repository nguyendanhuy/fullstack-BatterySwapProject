// ProvinceDistrictWardSelect.jsx
import { useEffect, useState } from "react";
import { Select, Space, message } from "antd";

const API = "https://provinces.open-api.vn/api/v1";

export default function ProvinceDistrictWardSelect({ value = {}, setFilterAddress, style }) {
    const [pList, setPList] = useState([]);// danh sách tỉnh
    const [dList, setDList] = useState([]);// danh sách huyện
    const [wList, setWList] = useState([]);// danh sách xã
    const [v, setV] = useState(value); // giá trị hiện tại được chọn
    //v (value) là object có dạng: { provinceCode, districtCode, wardCode }
    const [lp, setLp] = useState(false), // loading tinh
        [ld, setLd] = useState(false), //loading huyen
        [lw, setLw] = useState(false);// loading xa

    //dùng để cập nhật state & thông báo ra ngoài thong qua onChange.
    const emit = (patch) => {
        const next = { ...v, ...patch };
        setV(next);
        const { provinceName, districtName, wardName } = next;
        setFilterAddress({ provinceName, districtName, wardName });
    };
    // Load danh sách tỉnh khi component được gắn vào DOM
    useEffect(() => {
        (async () => {
            try {
                setLp(true);
                const data = await fetch(`${API}/p/`).then(r => r.json());
                setPList(data.map(p => ({ label: p.name, value: p.code })));
            } catch (e) {
                message.error("Không tải được tỉnh");
            } finally { setLp(false); }
        })
            ();
    }, []);
    // Load danh sách huyện khi tỉnh thay đổi
    useEffect(() => {
        if (!v.provinceCode) { setDList([]); setWList([]); return; }
        (async () => {
            try {
                setLd(true);
                const d = await fetch(`${API}/p/${v.provinceCode}?depth=2`).then(r => r.json());
                setDList((d.districts || []).map(x => ({ label: x.name, value: x.code })));
            } catch (e) { message.error("Không tải được huyện"); } finally { setLd(false); }
        })();
    }, [v.provinceCode]);
    // Load danh sách xã khi huyện thay đổi
    useEffect(() => {
        if (!v.districtCode) { setWList([]); return; }
        (async () => {
            try {
                setLw(true);
                const d = await fetch(`${API}/d/${v.districtCode}?depth=2`).then(r => r.json());
                setWList((d.wards || []).map(x => ({ label: x.name, value: x.code })));
            } catch (e) { message.error("Không tải được xã"); } finally { setLw(false); }
        })();
    }, [v.districtCode]);

    return (
        <Space style={style}>
            <Select style={{ minWidth: 150 }} placeholder="Tỉnh/TP" loading={lp} allowClear
                options={pList} value={v.provinceCode}
                // Khi tỉnh thay đổi, xóa luôn huyện và xã đã chọn
                onChange={(val) => {
                    const selected = pList.find(p => p.value === val);
                    emit({
                        provinceCode: val,
                        provinceName: selected?.label,
                        districtCode: undefined,
                        districtName: undefined,
                        wardCode: undefined,
                        wardName: undefined
                    });
                }}
                showSearch filterOption={(i, o) => o.label.toLowerCase().includes(i.toLowerCase())}
            />
            <Select style={{ minWidth: 150 }} placeholder="Quận/Huyện" loading={ld} disabled={!v.provinceCode} allowClear
                //Khi huyện thay đổi, xóa luôn xã đã chọn
                options={dList} value={v.districtCode}
                onChange={(val) => {
                    const selected = dList.find(d => d.value === val);
                    emit({
                        districtCode: val,
                        districtName: selected?.label,
                        wardCode: undefined,
                        wardName: undefined
                    });
                }}
                showSearch filterOption={(i, o) => o.label.toLowerCase().includes(i.toLowerCase())}
            />
            <Select style={{ minWidth: 150 }} placeholder="Phường/Xã" loading={lw} disabled={!v.districtCode} allowClear
                options={wList} value={v.wardCode}
                onChange={(val) => {
                    const selected = wList.find(w => w.value === val);
                    emit({
                        wardCode: val,
                        wardName: selected?.label
                    });
                }}
                //showSearch cho phép gõ tìm nhanh cùng với filterOption để lọc.
                showSearch filterOption={(i, o) => o.label.toLowerCase().includes(i.toLowerCase())}
            />
        </Space>
    );
}
