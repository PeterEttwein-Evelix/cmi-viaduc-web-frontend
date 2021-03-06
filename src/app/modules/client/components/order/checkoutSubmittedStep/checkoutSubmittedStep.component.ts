import {Component, OnInit} from '@angular/core';
import {Ordering, OrderItem, ShippingType, TranslationService} from '@cmi/viaduc-web-core';
import {ShoppingCartService, UrlService, AuthorizationService} from '../../../services';

@Component({
	selector: 'cmi-viaduc-order-submitted-step',
	templateUrl: 'checkoutSubmittedStep.component.html',
	styleUrls: ['./checkoutSubmittedStep.component.less']
})
export class CheckoutSubmittedStepComponent implements OnInit {

	private _items: OrderItem[] = [];
	public titleHtmlText: string;
	public introductionHtmlText: string;
	public thxHtmlText: string;
	public stateHtmlText: string;
	public backToCartHtmlText: string;
	public showError: boolean = false;
	public loading: boolean = true;

	public hasItemsInCartLeft: boolean = false;

	constructor(private _txt: TranslationService,
				private _scs: ShoppingCartService,
				private _url: UrlService,
				private _authorization: AuthorizationService) {

	}

	public ngOnInit(): void {
		this.showError = false;
		let order = this._scs.getActiveOrder();
		this._scs.getItemsWhereEinsichtsGesuchNoeting().subscribe(items => {
			this._items = items;
		});
		if (order.type === ShippingType.Einsichtsgesuch) {
			this._scs.orderEinsichtsgesuch(order).subscribe(() => {
					this._setText(order);
					this.loading = false;
			}, (error) => {
					this.showError = true;
					this.loading = false;
			});
		} else {
			this._scs.order(order).subscribe(() => {
				this._setText(order);
				this.loading = false;
			}, (error) => {
				this.showError = true;
				this.loading = false;
			});
		}
	}

	private _setText(order: Ordering) {
		switch (order.type) {
			case ShippingType.Verwaltungsausleihe:
				this.thxHtmlText = this._getHtmlTextForVerwaltungsausleihe();
				this._scs.getBasket().subscribe((data) => this.hasItemsInCartLeft = data.length > 0);
				break;
			case ShippingType.Lesesaalausleihen:
				this.thxHtmlText = this._getHtmlTextForLesesaal();
				this._scs.getBasket().subscribe((data) => this.hasItemsInCartLeft = data.length > 0);
				break;
			case ShippingType.Digitalisierungsauftrag:
				this.thxHtmlText = this._getHtmlForDigitalisat();
				this._scs.getBasket().subscribe((data) => this.hasItemsInCartLeft = data.length > 0);
				break;
			case ShippingType.Einsichtsgesuch:
				this.titleHtmlText = this._getTitleForEinsichtsgesuch();
				this.introductionHtmlText = this._getInterductionEinsichtsgesuch();
				this._setHtmlForEinsichtsgesuch();
				this._scs.getBasket().subscribe((data) => this.hasItemsInCartLeft = data.length > 0);
				break;
			default:
				this.thxHtmlText = '';
		}

		this.stateHtmlText = this._txt.translate('Den Status Ihrer Bestellung k??nnen Sie in Ihrem <a href="#/{0}">Benutzerkonto</a> verfolgen.',
			'checkoutSubmittedStep.checkStatusText', this._url.getBestellungenUrl());

		this.backToCartHtmlText = this._txt.translate('Sie haben noch offene Bestellungen im <a href="#/{0}">Bestellkorb</a>.', 'checkoutSubmittedStep.cartText', this._url.getBestellkorbUrl());
	}

	private _getHtmlTextForVerwaltungsausleihe(): string {
		return this._txt.translate('Vielen Dank f??r Ihre Bestellung. Sie erhalten die Unterlagen innerhalb von ein bis zwei Arbeitstagen per Post.', 'checkoutSubmittedStep.thxTextVerwaltungsausleihe');
	}

	private _getHtmlTextForLesesaal(): string {
		return this._txt.translate('Vielen Dank f??r Ihren Auftrag. Sie k??nnen die gew??nschten Unterlagen am gew??hlten Datum im ' +
			'<a href="#/{0}">Lesesaal des Bundesarchivs</a> einsehen. Der Lesesaal ist von Dienstag bis ' +
			'Donnerstag von 9 bis 19 Uhr ge??ffnet.', 'checkoutSubmittedStep.thxTextLesesaal', this._url.getContactUrl());
	}

	private _getHtmlForDigitalisat(): string {
		return this._txt.translate('Vielen Dank f??r Ihren Auftrag. Sie erhalten eine E-Mail, sobald die Unterlagen digitalisiert worden sind. ' +
			'Die Bearbeitung Ihres Auftrags dauert in der Regel zwei Wochen.', 'checkoutSubmittedStep.thxTextDigi', this._url.getContactUrl());
	}

	private _getTitleForEinsichtsgesuch(): string {
		return this._txt.translate('Empfangsbest??tigung', 'orderEinsichtCheckoutPage.bestellbestaetigung');
	}

	private _getInterductionEinsichtsgesuch(): string {
		return this._txt.translate('Vielen Dank f??r Ihr Einsichtsgesuch in folgende Unterlagen:', 'checkoutSubmittedStep.thxTextEischtisgesuchIntroduction');
	}

	private async _setHtmlForEinsichtsgesuch() {
		let html = '';
		if (this._items) {
			html = '<ul>';
			for (let item of this._items) {
				html += `<li><a href="#/archiv/einheit/${item.veId}">${item.referenceCode}</a></li>`;
			}
			html += '</ul><br>';
		}
		html += this._txt.translate('Wir werden Ihr Gesuch an die zust??ndige Stelle weiterleiten. ' +
			'Mit einem Entscheid k??nnen Sie in der Regel innerhalb von vier bis sechs Wochen rechnen.', 'checkoutSubmittedStep.thxTextEischtisgesuch');

		if (this._authorization.hasRole('??2')) {
			html += '<br>';
			html += this._txt.translate('Falls Ihr Gesuch bewilligt wird, m??ssen Sie sich identifizieren, um die Unterlagen online zu konsultieren (siehe <a href="{0}">Anmelden und Identifizieren</a>).',
				'checkoutSubmittedStep.thxTextEischtisgesuchAnmeldenUndIndentifizieren', this._url.getRegisterAndIdentifyInfo());
		}

		this.thxHtmlText = html;
	}

	public goBack(): void  {
		window.location.reload();
	}
}
