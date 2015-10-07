const weekday = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday'
	],
	abr_weekday = [
		'Sun',
		'Mon',
		'Tue',
		'Wed',
		'Thu',
		'Fri',
		'Sat',
		'Sun'
	],
	month = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	],
	abr_month = [
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
	RIGHT_PAD = 0,
	LEFT_PAD = 1;

function str_pad(val, len, dir, str) {
	const _str = str || '0',
		_val = ('' + val).slice(0, len);

	if (dir === LEFT_PAD) {
		return Array(len - _val.length + 1).join(_str) + _val;
	}

	return _val + Array(len - _val.length + 1).join(_str);
}

export function pad_money(val = 0) {
	const _val = '' + (Math.round(val * 100) / 100),
		idx = _val.indexOf('.');

	if (idx < 0) {
		return _val + '.00';
	}

	return _val.slice(0, idx) + '.' +
		str_pad(_val.slice(idx + 1), 2, RIGHT_PAD);
}

/**\

	Date Formatting
		just call .date(new Date(), '%b %Y'). All of the format string
		options are as follows:

		%y - year without century as a decimal number [00,99].
		%Y - year with century as a decimal number.
		%b - abbreviated month name.
		%B - full month name.
		%m - month as a decimal number [1,12].
		%d - zero-padded day of the month as a decimal number [01,31].
		%e - space-padded day of the month as a decimal number [ 1,31].
		%a - abbreviated weekday name.
		%A - full weekday name.
		%w - weekday as a decimal number [0(Sunday),6].
		%H - hour (24-hour clock) as a decimal number [00,23].
		%I - hour (12-hour clock) as a decimal number [01,12].
		%M - minute as a decimal number [00,59].
		%p - either AM or PM.
		%S - second as a decimal number [00,61].

\**/
export function date(in_date, format = '%b. %e, %Y, %I:%M %p') {
	const _in_date = in_date instanceof Date ? in_date : new Date(in_date),
		day = _in_date.getDay(),
		_month = _in_date.getMonth(),
		_date = _in_date.getDate(),
		hour = _in_date.getHours(),
		little_hour = (hour % 12) === 0 ? 12 : hour % 12,
		min = _in_date.getMinutes(),
		sec = _in_date.getSeconds(),
		year = '' + _in_date.getFullYear();

	return format.replace(/\%a/, abr_weekday[day], 'g')
		.replace(/\%A/, weekday[day], 'g')
		.replace(/\%w/, day, 'g')
		.replace(/\%b/, abr_month[_month], 'g')
		.replace(/\%B/, month[_month], 'g')
		.replace(/\%d/, str_pad(_date, 2, LEFT_PAD), 'g')
		.replace(/\%e/, str_pad(_date, 2, LEFT_PAD, ' '), 'g')
		.replace(/\%H/, str_pad(hour, 2, LEFT_PAD), 'g')
		.replace(/\%I/, str_pad(little_hour, 2, LEFT_PAD), 'g')
		.replace(/\%m/, _month + 1, 'g')
		.replace(/\%M/, str_pad(min, 2, LEFT_PAD), 'g')
		.replace(/\%p/, (hour > 11 ? 'PM' : 'AM'), 'g')
		.replace(/\%S/, str_pad(sec, 2, LEFT_PAD), 'g')
		.replace(/\%y/, year.slice(2), 'g')
		.replace(/\%Y/, year, 'g');
}
