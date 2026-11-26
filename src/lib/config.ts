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
  prefix?: string[];      // key headers matched from the start only, so a short style code doesn't hit the middle of a 10-digit order number (other keys match anywhere)
  lazy?: boolean;         // only fetched once the query looks like an order number
  so?: string;            // lazy tabs: Sales Order prefix they hold, so an order search only fetches its own file (unknown prefix: fetch all)
  meta?: string[];        // summary columns, overrides META
  short?: string;         // shortfall column, overrides COLS.short
  attach?: { to: string; on: string[] }; // not searched itself: its rows show inside the short rows of source `to`, where columns `on` equal `keys` (same order)
}

const F2 = '1yQNURTEAMJxPhurKf7qxwzRnAn3nwvgUrveI-qpTHoE', F3 = '1qGbrPanMBZNVP6lWBh3ETSLl8Pu7Ijo-7WfpsObHSic',
      F4 = '1TgY4elXf5Z_X2yrzfzdVgSkBGXqgJQ-ePBMlwlER0-Y', F5 = '1Kf5hLfhd7y3b9wPnAr9ftTrvxnkVJNCwjTp8oCsFfUE',
      F6 = '1w7Yxed6J_VvxTdZTy5w7WoAeti8UbD5I55zK86KAqwI', F7 = '1vNXcSyHhxgo-KMl6XVlWSv4cRdogLTdVqHCE-1nA7yc',
      F8 = '1xqmN1skY9zcUWdEdZrx0DESNtA4KJ0Fs9prQlXpkPQY', F9 = '1-L_LElcwFtADCdUkrlySi1k4XgchX4slfNuS5hA4Mvo',
      F10 = '1NK2JgDZwR8WvUy-CUSwvv4B11mbP9xIpHxyjzb5Efkg';

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
  { key: 'chitiet', group: 'candoi', name: 'Chi tiết (VB-OS-TL)', id: F7, gid: '453720443', tab: 'CHITIET', keys: ['Sales Order'], prefix: ['Sales Order'] },
  // CANDOI is ~9MB even cut to columns B:W
  { key: 'candoi', group: 'candoi', name: 'Cân đối (VB-OS-TL)', id: F7, gid: '1184735147', tab: 'CANDOI', range: 'B1:W', keys: ['Sales Order', 'CM#'], prefix: ['Sales Order'],
    lazy: true, so: '322', meta: ['Material', 'CM#', 'Sales Order'] },
  // In-transit material for CANDOI shortfalls; A:AO ends at "Mua hàng phản hồi" (~2.8MB)
  { key: 'tdv', group: 'candoi', name: 'Hàng trên đường về', id: F8, gid: '491317618', tab: 'CÂN ĐỐI TĐV', range: 'A1:AO', keys: ['SO', 'CM#'],
    lazy: true, so: '322', attach: { to: 'candoi', on: ['Sales Order', 'CM#'] } },
  // Same layout for Coach / Kate Spade (SO 321…), but the shortfall column is "+/-"; CANDOI is ~12.6MB even cut to B:W
  { key: 'chitiet-ck', group: 'candoi', name: 'Chi tiết (CH-KS)', id: F9, gid: '1885388257', tab: 'CHITIET', keys: ['Sales Order'], prefix: ['Sales Order'] },
  { key: 'candoi-ck', group: 'candoi', name: 'Cân đối (CH-KS)', id: F9, gid: '882315447', tab: 'CANDOI', range: 'B1:W', keys: ['Sales Order', 'CM#'], prefix: ['Sales Order'],
    lazy: true, so: '321', meta: ['Material', 'CM#', 'Sales Order'], short: '+/-' },
  // A:AQ ends at "Mua hàng phản hồi" (~6.2MB)
  { key: 'tdv-ck', group: 'candoi', name: 'Hàng trên đường về (CH-KS)', id: F10, gid: '491317618', tab: 'CANDOITĐV', range: 'A1:AQ', keys: ['so', 'CM#'],
    lazy: true, so: '321', attach: { to: 'candoi-ck', on: ['Sales Order', 'CM#'] } },
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
  transit: ['Tổng trên đường về', 'Đáp ứng MH', 'PO', 'NCU', 'Transport method', 'ETD', 'Delivery Date', 'Ngày eta', 'Tuần ETA', 'Material Issue', 'NV Mua hàng', 'Mua hàng phản hồi'],
  transitKey: ['Delivery Date', 'Ngày eta', 'Tuần ETA', 'Material Issue', 'Mua hàng phản hồi'],
  pinned: {
    coach: ['PA DUYỆT – PD VN/China', 'KHU VỰC MAY PA', 'Tính Ontime/Late', 'PA NOTE'],
    travel: ['Approval Status', 'Ontime', 'KQ Ontime', 'NGÀY VT VỀ', 'MĐ NHẬN', 'TV NHẬN', 'NOTE'],
    candoi: ['THIẾU MH', '+/-', 'Ngày XH', 'NGÀY XHÀNG', 'Ngày VT về', 'Số item thiếu', 'TT Cung ứng', 'TT Đồng bộ'],
  } as Partial<Record<Group, string[]>>, // shown first and highlighted in details
};

export const FAIL = /reject|không đạt/i, PASS = /^approv(al|ed)$|^ok$|^đạt$|^đã duyệt$/i;
export const PAGE = 30;
export const isOrderNo = (q: string) => /^\d{7,}$/.test(q);
export const isCm = (q: string) => /^[A-Z]+-.{2,}/.test(q); // "H-VB30373": CM# of a CANDOI row, its SO is unknown so every lazy tab is fetched
