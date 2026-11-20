// Agentic AI-pagina: extra validatie en meldingen op het Ninja Forms-formulier "Aanvraag AI-werksessie"
(function ($) {
	if (typeof Marionette === 'undefined' || typeof nfRadio === 'undefined') return;

	// Foutmelding per verplicht veld (Ninja Forms kent alleen één algemene tekst)
	var verplicht = {
		naam: 'Vul je naam in.',
		bedrijfsnaam: 'Vul de naam van je bedrijf in.',
		email: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.',
		privacy: 'Ga akkoord met de privacyverklaring om je aanvraag te versturen.'
	};

	function vandaag() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
	function leesDatum(v) {
		var m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v || '');
		return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
	}
	function veld(form, key) {
		return form.get('fields').findWhere({ key: key });
	}
	function zetFout(model, code, tekst) {
		if (tekst) nfRadio.channel('fields').request('add:error', model.get('id'), code, tekst);
		else nfRadio.channel('fields').request('remove:error', model.get('id'), code);
	}

	function controleerData(form) {
		var d1m = veld(form, 'voorkeursdatum'), d2m = veld(form, 'tweede_voorkeur');
		if (!d1m || !d2m) return;
		var d1 = leesDatum(d1m.get('value')), d2 = leesDatum(d2m.get('value'));
		var f1 = '', f2 = '';
		if (d1 && d1 < vandaag()) f1 = 'Kies een datum vanaf vandaag.';
		else if (d1 && (d1.getDay() === 0 || d1.getDay() === 6)) f1 = 'Kies een werkdag (maandag t/m vrijdag).';
		if (d2 && d2 < vandaag()) f2 = 'Kies een datum vanaf vandaag.';
		else if (d2 && (d2.getDay() === 0 || d2.getDay() === 6)) f2 = 'Kies een werkdag (maandag t/m vrijdag).';
		else if (d1 && d2 && d1.getTime() === d2.getTime()) f2 = 'Kies een andere datum dan je eerste voorkeur.';
		zetFout(d1m, 'dis-datum', f1);
		zetFout(d2m, 'dis-datum', f2);
	}

	function controleerTelefoon(form) {
		var m = veld(form, 'telefoon');
		if (!m) return;
		var v = String(m.get('value') || '').trim();
		zetFout(m, 'dis-tel', v && !/^[0-9+()\-.\s]{8,20}$/.test(v) ? 'Dit telefoonnummer lijkt niet te kloppen.' : '');
	}

	var Controller = Marionette.Object.extend({
		initialize: function () {
			this.listenTo(nfRadio.channel('forms'), 'init:model', this.formInit);
			this.listenTo(nfRadio.channel('fields'), 'change:modelValue', this.veldGewijzigd);
			this.listenTo(nfRadio.channel('forms'), 'submit:failed', this.focusEersteFout);
			this.listenTo(nfRadio.channel('flatpickr'), 'init', this.datumkiezer);
			this.listenTo(nfRadio.channel('forms'), 'submit:response', this.naVerzenden);
		},
		naVerzenden: function (response, textStatus, jqXHR, formID) {
			var form = nfRadio.channel('app').request('get:form', formID);
			if (!this.isOnsForm(form)) return;
			var ok = response && (!response.errors || !Object.keys(response.errors).length);
			if (ok) return; // bij succes stuurt het formulier door naar de bedankpagina
			var fout = document.querySelector('#nf-form-' + formID + '-cont .nf-form-errors');
			if (fout && !fout.querySelector('.dis-fout')) {
				fout.insertAdjacentHTML('beforeend', '<div class="nf-error-msg dis-fout" role="alert"><strong>Versturen is niet gelukt.</strong> Lukt het niet? Neem contact op via onze <a href="/contact/">contactpagina</a>.</div>');
			}
		},
		isOnsForm: function (form) {
			return form && form.get('settings') && form.get('settings').key === 'ai_werksessie';
		},
		formInit: function (form) {
			if (!this.isOnsForm(form)) return;
			// Eigen meldingen bij lege verplichte velden
			form.get('fields').each(function (m) {
				var key = m.get('key');
				if (!verplicht[key]) return;
				m.get('errors').on('add', function (err) {
					if (err.get('id') === 'required-error' || err.get('id') === 'invalid_email') err.set('msg', verplicht[key]);
				});
			});
		},
		veldGewijzigd: function (model) {
			var form = nfRadio.channel('app').request('get:form', model.get('formID'));
			if (!this.isOnsForm(form)) return;
			if (['voorkeursdatum', 'tweede_voorkeur'].indexOf(model.get('key')) > -1) controleerData(form);
			if (model.get('key') === 'telefoon') controleerTelefoon(form);
		},
		datumkiezer: function (picker, model) {
			if (['voorkeursdatum', 'tweede_voorkeur'].indexOf(model.get('key')) === -1) return;
			picker.set('minDate', 'today');
			picker.set('disable', [function (d) { return d.getDay() === 0 || d.getDay() === 6; }]);
			picker.set('locale', { firstDayOfWeek: 1 });
		},
		focusEersteFout: function (form) {
			if (!this.isOnsForm(form)) return;
			var id = form.get('id');
			setTimeout(function () {
				var el = document.querySelector('#nf-form-' + id + '-cont .nf-error .ninja-forms-field');
				if (el) el.focus();
			}, 50);
		}
	});

	new Controller();
})(jQuery);
