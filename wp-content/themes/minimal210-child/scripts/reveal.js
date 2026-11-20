// Scroll-reveal voor elementen met class "rv" (rij 17 t/m 24). Laadt in de head, zodat er niets zichtbaar knippert.
(function () {
	if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	document.documentElement.classList.add('rv-ready');

	document.addEventListener('DOMContentLoaded', function () {
		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('in');
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
		document.querySelectorAll('.row.flex-content .rv').forEach(function (el) { observer.observe(el); });
	});
})();
