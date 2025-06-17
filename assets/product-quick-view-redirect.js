document.addEventListener("DOMContentLoaded", function () {
  const quickViewButtons = document.querySelectorAll(
    ".m-product-quickview-button"
  );
  quickViewButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const productHandle = this.dataset.productHandle;
      if (productHandle) {
        window.location.href = "/products/" + productHandle;
      }
    });
  });
});
