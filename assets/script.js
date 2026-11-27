(() => {
  "use strict";

  const body = document.body;
  const navLinks = Array.from(document.querySelectorAll("[data-section]"));
  const progress = document.getElementById("railProgress");
  const sections = ["cover", "focus", "work", "contribute"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  // A single, orchestrated entrance for the cover.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => body.classList.add("is-ready"));
  });

  let ticking = false;

  const updateScrollState = () => {
    ticking = false;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const ratio = Math.min(1, Math.max(0, scrollTop / scrollable));

    if (progress) {
      progress.style.height = `${(ratio * 100).toFixed(2)}%`;
    }

    const marker = window.innerHeight * 0.38;
    let current = sections[0];

    for (const section of sections) {
      if (section.getBoundingClientRect().top <= marker) {
        current = section;
      }
    }

    navLinks.forEach((link) => {
      const isActive = link.dataset.section === current?.id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollState);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateScrollState();

  // Project dialogs
  const dialogTriggers = Array.from(document.querySelectorAll("[data-dialog]"));

  const syncModalState = () => {
    const hasOpenDialog = Boolean(document.querySelector("dialog[open]"));
    body.classList.toggle("modal-open", hasOpenDialog);
  };

  const closeDialog = (dialog) => {
    if (!dialog || !dialog.open) return;
    dialog.close();
  };

  dialogTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const dialog = document.getElementById(trigger.dataset.dialog);
      if (!dialog) return;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      dialog.setAttribute("tabindex", "-1");
      dialog.focus({ preventScroll: true });
      syncModalState();
    });
  });

  document.querySelectorAll("dialog.modal").forEach((dialog) => {
    dialog.addEventListener("close", syncModalState);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog(dialog);
      }
    });
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeDialog(button.closest("dialog"));
    });
  });

  // Copy email with a graceful fallback for non-secure contexts.
  const copyButton = document.querySelector("[data-copy]");
  const copyStatus = document.querySelector("[data-copy-status]");

  const setCopyStatus = (message) => {
    if (copyStatus) copyStatus.textContent = message;
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } catch (error) {
      succeeded = false;
    }
    textarea.remove();
    return succeeded;
  };

  if (copyButton) {
    const email = copyButton.dataset.copy || "";
    const originalLabel = copyButton.textContent;

    copyButton.addEventListener("click", async () => {
      let copied = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          copied = await Promise.race([
            navigator.clipboard
              .writeText(email)
              .then(() => true)
              .catch(() => false),
            new Promise((resolve) => window.setTimeout(() => resolve(false), 900)),
          ]);
        } catch (error) {
          copied = false;
        }
      }

      if (!copied) {
        copied = fallbackCopy(email);
      }

      if (copied) {
        copyButton.textContent = "已复制 ✓";
        setCopyStatus("邮箱已复制到剪贴板。");
      } else {
        setCopyStatus("复制失败，请手动选择上方邮箱地址。");
      }

      window.setTimeout(() => {
        copyButton.textContent = originalLabel;
        setCopyStatus("");
      }, 2600);
    });
  }

  // Close an open dialog with Escape even in very old dialog polyfills.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openDialog = document.querySelector("dialog.modal[open]");
    if (openDialog) closeDialog(openDialog);
  });
})();
