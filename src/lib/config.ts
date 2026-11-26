// What to read and how to read it. Adding a sheet = one entry in SOURCES.

export type Group = 'coach' | 'travel' | 'candoi';

export interface Source {
  key: string;            // stable id for React keys and UI state (gid can change, see `tab`)
  group: Group;
  name: string;
  id: string;             // spreadsheet id
  gid: string;            // tab id
  tab?: string;           // tab name: the tab gets deleted and recreated (new gid), so on HTTP 400 the gid is looked up again by name
  range?: string;         // export only these columns (big tabs)
  keys: string[];         // header names matched against the query; the header row is the first of the top 5 rows containing one
  prefix?: boolean;       // match from the start only, so a short style code doesn't hit the middle of a 10-digit order number
  lazy?: boolean;         // only fetched once the query looks like an order number
  meta?: string[];        // summary columns, overrides META
}

const F2 = '1yQNURTEAMJxPhurKf7qxwzRnAn3nwvgUrveI-qpTHoE', F3 = '1qGbrPanMBZNVP6lWBh3ETSLl8Pu7Ijo-7WfpsObHSic',
      F4 = '1TgY4elXf5Z_X2yrzfzdVgSkBGXqgJQ-ePBMlwlER0-Y', F5 = '1Kf5hLfhd7y3b9wPnAr9ftTrvxnkVJNCwjTp8oCsFfUE',
      F6 = '1w7Yxed6J_VvxTdZTy5w7WoAeti8UbD5I55zK86KAqwI', F7 = '1vNXcSyHhxgo-KMl6XVlWSv4cRdogLTdVqHCE-1nA7yc';

export const SOURCES: Source[] = [
  { key: 'pa-data', group: 'coach', name: 'Theo dõi PA (DATA)', id: F2, gid: '1363034961', keys: ['STYLE'] },
  { key: 'reject', group: 'coach', name: 'Theo dõi reject', id: F2, gid: '849460225', keys: ['STYLE'] },
  { key: 'pa-list', group: 'coach', name: 'PA list', id: F2, gid: '558887054', keys: ['Style'] },
  { key: 'tui-pa', group: 'coach', name: 'Theo dõi túi PA', id: F2, gid: '1041297598', keys: ['MÃ'] },
  { key: 'pa-coach', group: 'coach', name: 'PA Coach', id: F3, gid: '201883774', keys: ['Style'] },
  { key: 'pa-ks', group: 'coach', name: 'PA Kate Spade', id: F3, gid: '205650717', keys: ['Style'] },
  { key: 'po', group: 'travel', name: 'Danh sách PO', id: F4, gid: '1491559955', keys: ['Style', 'Style + Grid'] },
  { key: 'pps', group: 'travel', name: 'PPS List', id: F4, gid: '2097556221', keys: ['Style', 'Style + Grid'] },
  { key: 'pps-tl', group: 'travel', name: 'PPS TL', id: F6, gid: '1577043958', keys: ['Style'] },
  { key: 'pa-travel', group: 'travel', name: 'PA list (Travel)', id: F5, gid: '715633471', keys: ['Style', 'Style + Grid'] },
  { key: 'vt-md', group: 'travel', name: 'Vật tư Miền Đông', id: F5, gid: '1131181694', keys: ['CM#'] },
  { key: 'vt-tv', group: 'travel', name: 'Vật tư Trà Vinh', id: F5, gid: '1057713774', keys: ['CM#'] },
  { key: 'chitiet', group: 'candoi', name: 'Chi tiết (VB-OS-TL)', id: F7, gid: '386902746', tab: 'CHITIET', keys: ['Sales Order'], prefix: true },
  // CANDOI is ~9MB even cut to columns B:W
  { key: 'candoi', group: 'candoi', name: 'Cân đối (VB-OS-TL)', id: F7, gid: '1671683756', tab: 'CANDOI', range: 'B1:W', keys: ['Sales Order'], prefix: true,
    lazy: true, meta: ['Material', 'CM#'] },
];

// Style images: tab H.ANH lists Drive files in blocks of "Tên" (KP221.jpg) + "ID Tập" (Drive file id).
export const IMG_SRC = { id: '102NRQ6aK6DXyvrRz0EgVpBSGp8M97-2x-PBUT0D11Ow', gid: '1824120797' };

export const GROUPS: [Group | 'all', string][] = [['all', 'Tất cả'], ['coach', 'Coach / Kate Spade'], ['travel', 'Travel / Golf'], ['candoi', 'Cân đối']];

// Column names, matched exactly against the (whitespace-collapsed) header.
export const COLS = {
  sku: ['SKU', 'Material description'],                // "54507-22519-TP": the style is the part before the first "-"
  name: ['STYLE NAME', 'Style Name', 'Style name', 'Material description', 'SKU'],
  meta: ['Buy', 'BUY', 'PLAN MONTH', 'TEAM', 'NHÀ MÁY', 'NGÀY NHẬN TÚI', 'Reference PO # (VBD PO)', 'ĐVT', 'Grand Total'],
  status: ['DUYỆT PA', 'Approval Status', 'NOTE', 'TV NHẬN', 'MĐ NHẬN'], // first of these (in order) with a short value
  late: ['Tính Ontime/Late', 'Ontime', 'KQ Ontime'],                  // adds a "trễ" note
  short: 'THIẾU MH',                                                   // CANDOI: "-" = enough material, anything else is the shortfall
  pinned: { coach: ['PA DUYỆT – PD VN/China', 'KHU VỰC MAY PA', 'Tính Ontime/Late', 'PA NOTE'] } as Partial<Record<Group, string[]>>, // shown first and highlighted in details
};

export const FAIL = /reject|không đạt/i, PASS = /^approv(al|ed)$|^ok$|^đạt$|^đã duyệt$/i;
export const PAGE = 30;
export const isOrderNo = (q: string) => /^\d{7,}$/.test(q);
