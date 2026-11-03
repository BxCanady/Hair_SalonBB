export const bookHref = (serviceId: string | null) => (serviceId ? `/book?serviceId=${encodeURIComponent(serviceId)}` : "/book");
