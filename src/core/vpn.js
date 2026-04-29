export const adminRoot = `${location.origin}/wp-admin/`;

export const ensureVpn = async (message = "⚠️ VPN", timeout = 1500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${adminRoot}admin-ajax.php`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(message);
  } catch {
    throw new Error(message);
  } finally {
    clearTimeout(timer);
  }
};
