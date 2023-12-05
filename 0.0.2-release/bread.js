<mvt:item name="breadpay" param="bread_data" />
(function(){
	let breadSetup = {integrationKey: "YOUR-INTEGRATION-KEY"};
	let enableCartSizeFiltering = "&mvte:bread_cart_size_filter_enabled;";
	let minBreadPrice = &mvte:bread_min_cart;;
	let maxBreadPrice = &mvte:bread_max_cart;;

	let breadQuantitySelector = undefined

	let breadPrice = 0;

	let wasSetup = false;

	function renderPDPButton(data) {
		let breadCurrency = "USD"; // TODO add support for CAD
		let breadPlacements = [];
		for (const placement of data) {
			let breadPlacement = {};
			breadPlacement.allowCheckout =  false;
			breadPlacement.domID = placement.id;
			breadPlacement.order = {};
			breadPlacement.order.items = []; // TODO fill in items array
			let breadTotalPrice = placement.price;
			if (breadQuantitySelector) {
				breadTotalPrice *= Number(breadQuantitySelector.value);
			}

			breadPlacement.order.subTotal = {value: breadTotalPrice, currency: breadCurrency};
			breadPlacement.order.totalPrice = {value: breadTotalPrice, currency: breadCurrency};
			breadPlacement.order.currency = breadCurrency;
			breadPlacement.order.totalShipping = { value: 0, currency: breadCurrency };
			breadPlacement.order.totalTax =  { value: 0, currency: breadCurrency };
			breadPlacement.order.totalDiscounts =  { value: 0, currency: breadCurrency };
			breadPlacements.push(breadPlacement);
		}
		if (!wasSetup) {
			window.BreadPayments.setup(breadSetup);
			window.BreadPayments.on('INSTALLMENT:APPLICATION_DECISIONED', () => {});
			window.BreadPayments.on('INSTALLMENT:APPLICATION_CHECKOUT', () => {});
			window.BreadPayments.on('INSTALLMENT:INITIALIZED', () => {});
			window.BreadPayments.registerPlacements(breadPlacements);
			window.BreadPayments.__internal__.init();
			wasSetup = true;
		} else {
			window.BreadPayments.registerPlacements(breadPlacements);
		}
	}

	function minMaxCheck(curPrice, minPrice, maxPrice) {
		if (enableCartSizeFiltering === "off") {
			return true;
		}
		minPrice = Math.round(minPrice * 100);
		maxPrice = Math.round(maxPrice * 100);
		if (minPrice === 0 && maxPrice === 0) {
			return true;
		} else if (maxPrice === 0 && curPrice >= minPrice) {
			return true;
		} else if (minPrice <= curPrice && curPrice <= maxPrice) {
			return true;
		}
		return false;
	}

	function skuCheck(sku) {
		const bread_sku_filter_mode = "&mvte:bread_sku_filter_mode;";
		const bread_sku_filter = "&mvte:bread_sku_filter;";
		var bread_sku_filter_list = bread_sku_filter.split(",").map(function(item) {
			return item.trim();
		});
		if (bread_sku_filter_mode == "none") {
			return true;
		} else if (bread_sku_filter_mode == "include") {
			return bread_sku_filter_list.includes(sku);
		} else if (bread_sku_filter_mode == "exclude") {
			return !bread_sku_filter_list.includes(sku);
		}
		return false;
	}

	<mvt:if expr="l.settings:page:code EQ 'PROD'">
		breadPrice = Math.round(&mvt:product:price * 100);
		if (!minMaxCheck(breadPrice, minBreadPrice, maxBreadPrice)) {
			return;
		}
		if (!skuCheck("&mvt:product:sku;")) {
			return;
		}

		let breadQuantityElements = document.getElementsByName("Quantity")
		if (breadQuantityElements.length > 0) {
			breadQuantitySelector = breadQuantityElements[0];
		}

		let breadQuantity = 1;
		if (breadQuantitySelector) {
			breadQuantity = Number(breadQuantitySelector.value);
		}

		let quantityIntervalId = setInterval(function() {
			let prevQuantity = breadQuantity;
			if (breadQuantitySelector) {
				breadQuantity = Number(breadQuantitySelector.value);
			}
			if (prevQuantity != breadQuantity) {
				renderPDPButton([{id: "bread-button", price: breadPrice}])
			}
		}, 500);
		renderPDPButton([{id: "bread-button", price: breadPrice}]);

		MivaEvents.SubscribeToEvent('price_changed', function (product_data) {
			breadPrice = Math.round(product_data.price * 100);
			renderPDPButton([{id: "bread-button", price: breadPrice}]);
		});
	<mvt:elseif expr="l.settings:page:code EQ 'CTGY'">
		let breadAsLowAsContainers = document.getElementsByClassName("bread-ala");
		let breadData = [];
		for (const container of breadAsLowAsContainers) {
			breadPrice = Math.round(container.dataset.price * 100);
			const breadSku = container.dataset.sku;
			if (!minMaxCheck(breadPrice, minBreadPrice, maxBreadPrice)) {
				continue;
			}
			if (!skuCheck(breadSku)) {
				continue;
			}
			breadData.push({price: breadPrice, id: container.id});
		}
		renderPDPButton(breadData);
	<mvt:elseif expr="l.settings:page:code EQ 'BASK'">
		breadPrice = &mvt:basket:total * 100;
		if (!minMaxCheck(breadPrice, minBreadPrice, maxBreadPrice)) {
			return;
		}
		let breadSku = "";
		<mvt:foreach iterator="group" array="basket:groups">
			breadSku = "&mvt:group:product:sku;";
			if (!skuCheck(breadSku)) {
				return;
			}
		</mvt:foreach>
		renderPDPButton([{id: "bread-button", price: breadPrice}]);
	</mvt:if>
})();
