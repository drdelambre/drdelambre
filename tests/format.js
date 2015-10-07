import { pad_money, date as fmt_date } from 'base/format';

const abr_month = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	],
	LEFT_PAD = 1;

function str_pad(val, len, dir, str) {
	const _str = str || '0',
		_val = ('' + val).slice(0, len);

	if (dir === LEFT_PAD) {
		return Array(len - _val.length + 1).join(_str) + _val;
	}

	return _val + Array(len - _val.length + 1).join(_str);
}

describe('Date formatting', function() {
	it('should have a default format', function() {
		var date = new Date(),
			str1 = fmt_date(date),
			str2 = fmt_date(date, undefined),
			expected = abr_month[date.getMonth()] + '. ' +
				str_pad(date.getDate(), 2, LEFT_PAD, ' ') + ', ' +
				date.getFullYear() + ', ' +
				str_pad(
					(date.getHours() % 12) === 0 ? 12 : date.getHours() % 12,
					2,
					LEFT_PAD
				) + ':' + str_pad(date.getMinutes(), 2, LEFT_PAD) + ' ' +
				(date.getHours() > 11 ? 'PM' : 'AM');

		expect(str1).to.equal(expected);
		expect(str2).to.equal(expected);
	});

	it('should try to parse some dates', function() {
		var date = new Date(),
			date_str = date.toISOString(),
			str1 = fmt_date(date_str),
			str2 = fmt_date(date.valueOf()),
			expected = abr_month[date.getMonth()] + '. ' +
				str_pad(date.getDate(), 2, LEFT_PAD, ' ') + ', ' +
				date.getFullYear() + ', ' +
				str_pad(
					(date.getHours() % 12) === 0 ? 12 : date.getHours() % 12,
					2,
					LEFT_PAD
				) + ':' + str_pad(date.getMinutes(), 2, LEFT_PAD) + ' ' +
				(date.getHours() > 11 ? 'PM' : 'AM');

		expect(str1).to.equal(expected);
		expect(str2).to.equal(expected);
	});

	it('should take a custom format', function() {
		var date = new Date(),
			str = fmt_date(date, '%b says HELLO'),
			expected = abr_month[date.getMonth()] + ' says HELLO';

		expect(str).to.equal(expected);
	});

	it('should handle the meridian', function() {
		var date = new Date(),
			str;

		date.setHours(11);
		str = fmt_date(date, '%I %p');
		expect(str).to.equal('11 AM');

		date.setHours(14);
		str = fmt_date(date, '%I %p');
		expect(str).to.equal('02 PM');

		date.setHours(0);
		str = fmt_date(date, '%I %p');
		expect(str).to.equal('12 AM');

		date.setHours(0);
		str = fmt_date(date, '%I %p');
		expect(str).to.equal('12 AM');

		date.setHours(12);
		str = fmt_date(date, '%I %p');
		expect(str).to.equal('12 PM');
	});
});

describe('Money padding', function() {
	it('should handle null', function() {
		expect(pad_money()).to.equal('0.00');
	});

	it('should handle 0', function() {
		expect(pad_money(0)).to.equal('0.00');
	});

	it('should handle numbers', function() {
		expect(pad_money(0.1)).to.equal('0.10');
		expect(pad_money(0.01)).to.equal('0.01');
		expect(pad_money(0.001)).to.equal('0.00');
		expect(pad_money(12)).to.equal('12.00');
		expect(pad_money(123.24)).to.equal('123.24');
		expect(pad_money(37.005)).to.equal('37.01');
		expect(pad_money(-37.005)).to.equal('-37.01');
	});
});
