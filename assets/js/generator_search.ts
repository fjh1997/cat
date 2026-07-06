(() => {
  if ((window as any).__reimuGeneratorSearchInit) return;
  (window as any).__reimuGeneratorSearchInit = true;

  const searchInput = document.querySelector("#reimu-search-input");
  const searchResult = document.querySelector("#reimu-hits");
  const pagination = document.querySelector("#reimu-pagination");
  const popup = document.querySelector(".popup");
  const mask = document.querySelector("#mask");
  const container = document.querySelector("#container") as HTMLElement | null;
  const headerNav = document.querySelector("#header-nav") as HTMLElement | null;
  const trigger = document.querySelector(".popup-trigger");
  const closeBtn = document.querySelector(".popup-btn-close");
  const itemsPerPage = 10;
  let currentPage = 1;
  let index: Array<{ title?: string; url: string; content?: string }> = [];

  if (!searchInput || !searchResult || !pagination || !popup) return;

  searchInput.innerHTML =
    '<form id="search-form"><input type="search" id="search-text" autocomplete="off" aria-label="Search"></form>';

  const form = document.querySelector("#search-form") as HTMLFormElement | null;
  const input = document.querySelector("#search-text") as HTMLInputElement | null;
  const base = (window as any).siteConfig?.base || "/";
  const searchUrl = new URL("search.json", base.replace(/\/?$/, "/")).toString();

  fetch(searchUrl)
    .then((response) => {
      if (!response.ok) throw new Error(response.statusText);
      return response.json();
    })
    .then((data) => {
      index = Array.isArray(data) ? data : [];
    })
    .catch((error) => console.error("Local search index failed to load:", error));

  const runSearch = () => {
    const query = (input?.value || "").trim().toLowerCase();
    searchResult.innerHTML = "";
    pagination.innerHTML = "";
    currentPage = 1;
    if (!query) return;

    const hits = index.filter((post) => {
      const title = (post.title || "").toLowerCase();
      const content = (post.content || "").toLowerCase();
      return title.includes(query) || content.includes(query);
    });

    renderPagination(hits);
    renderHits(hits, currentPage);
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch();
  });
  input?.addEventListener("input", runSearch);

  function renderPagination(hits: typeof index) {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(hits.length / itemsPerPage);
    if (totalPages <= 1) return;
    const list = document.createElement("ul");
    list.className = "ais-Pagination-list pagination";
    for (let i = 1; i <= totalPages; i++) {
      const item = document.createElement("li");
      item.className = "ais-Pagination-item pagination-item ais-Pagination-item--page";
      if (i === currentPage) item.classList.add("ais-Pagination-item--selected", "current");
      const link = document.createElement("a");
      link.className = "ais-Pagination-link page-number";
      link.href = "#";
      link.textContent = String(i);
      link.setAttribute("aria-label", `Page ${i}`);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        currentPage = i;
        renderPagination(hits);
        renderHits(hits, currentPage);
      });
      item.appendChild(link);
      list.appendChild(item);
    }
    pagination.appendChild(list);
  }

  function renderHits(hits: typeof index, page: number) {
    searchResult.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    hits.slice(start, start + itemsPerPage).forEach((hit) => {
      const link = document.createElement("a");
      link.href = hit.url;
      link.className = "reimu-hit-item-link";
      link.title = hit.title || "";
      link.textContent = hit.title || hit.url;
      searchResult.appendChild(link);
    });
    if (!hits.length && input?.value) {
      const empty = document.createElement("div");
      empty.id = "reimu-hits-empty";
      empty.textContent = "No results";
      searchResult.appendChild(empty);
    }
  }

  const closePopup = () => {
    popup.classList.remove("show");
    mask?.classList.add("hide");
    if (container) container.style.marginRight = "";
    if (headerNav) headerNav.style.marginRight = "";
    document.body.style.overflow = "";
    (trigger as HTMLElement | null)?.focus();
  };

  trigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    const scrollWidth = window.innerWidth - document.documentElement.offsetWidth;
    if (container) container.style.marginRight = `${scrollWidth}px`;
    if (headerNav) headerNav.style.marginRight = `${scrollWidth}px`;
    popup.classList.add("show");
    mask?.classList.remove("hide");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => input?.focus(), 100);
  });

  closeBtn?.addEventListener("click", closePopup);
  mask?.addEventListener("click", closePopup);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("show")) closePopup();
  });
})();
