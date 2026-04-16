import { formatToClientTimezone, ucfirst } from "@/helpers/format";
import { axiosInstance } from "@/plugins/axios";

// ── Fallback assets ──────────────────────────────────────────────
export const fallbackThumbnail = new URL(
    "@/assets/images/thumbnails/kk-bansos-6.jpg",
    import.meta.url,
).href;
export const fallbackProfilePicture = new URL(
    "@/assets/images/photos/kk-preview.png",
    import.meta.url,
).href;
export const proofPlaceholder = new URL(
    "@/assets/images/thumbnails/thumbnail-bansos-preview.svg",
    import.meta.url,
).href;

// ── Image normalisation ──────────────────────────────────────────
const apiOrigin = new URL(axiosInstance.defaults.baseURL ?? window.location.origin).origin;

export function normalizeImageUrl(value, fallback) {
    if (!value || typeof value !== "string") return fallback;

    const trimmed = value.trim();
    if (!trimmed) return fallback;

    if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;

    const nestedHttpIndex = trimmed.indexOf("http", trimmed.indexOf("http") + 1);
    if (nestedHttpIndex > 0) return trimmed.slice(nestedHttpIndex);

    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const relativePath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return new URL(relativePath, apiOrigin).href;
}

export function getThumbnail(value) {
    return normalizeImageUrl(value, fallbackThumbnail);
}

export function getProfilePicture(value) {
    return normalizeImageUrl(value, fallbackProfilePicture);
}

export function handleImageError(event, fallback) {
    event.target.src = fallback;
}

// ── Formatters ───────────────────────────────────────────────────
const CATEGORY_MAP = {
    staple: "Bahan Pokok",
    cash: "Uang Tunai",
    "subsidized fuel": "BBM Subsidi",
    health: "Kesehatan",
    goods: "Barang",
    service: "Layanan",
    education: "Pendidikan",
    food: "Pangan",
};

export function formatCategory(value) {
    return CATEGORY_MAP[value] ?? ucfirst(value ?? "-");
}

export function formatAvailability(value) {
    return value ? "Tersedia" : "Tidak Tersedia";
}

export function formatRecipientsCount(value) {
    const count = Number(value ?? 0);
    return `${new Intl.NumberFormat("id-ID").format(count)} Warga`;
}

export function formatCreatedAt(value) {
    return value ? formatToClientTimezone(value) : "-";
}

// ── Status / Availability configs ────────────────────────────────
const STATUS_MAP = {
    pending: { label: "Menunggu", className: "bg-desa-yellow" },
    approved: { label: "Disetujui", className: "bg-desa-green" },
    rejected: { label: "Ditolak", className: "bg-desa-red" },
};

export function getStatusConfig(status) {
    return (
        STATUS_MAP[status] ?? {
            label: ucfirst(status ?? "Unknown"),
            className: "bg-desa-black",
        }
    );
}

export function getAvailabilityConfig(value) {
    return value
        ? { className: "bg-desa-soft-green/10", textClassName: "text-desa-soft-green" }
        : { className: "bg-desa-red/10", textClassName: "text-desa-red" };
}

// ── Bank logo mapping ────────────────────────────────────────────
const BANK_LOGOS = {
    bca: new URL("@/assets/images/logos/bca.svg", import.meta.url).href,
    bri: new URL("@/assets/images/logos/bri.svg", import.meta.url).href,
    bni: new URL("@/assets/images/logos/bni.svg", import.meta.url).href,
    mandiri: new URL("@/assets/images/logos/mandiri.svg", import.meta.url).href,
    btn: new URL("@/assets/images/logos/btn.svg", import.meta.url).href,
    permata: new URL("@/assets/images/logos/permata.svg", import.meta.url).href,
};

export function getBankLogo(bankName) {
    if (!bankName) return null;
    return BANK_LOGOS[bankName.toLowerCase()] ?? null;
}
