const data = null;

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function () {
	if (this.readyState === this.DONE) {
		console.log(this.responseText);
	}
});

xhr.open('GET', 'https://sportapi7.p.rapidapi.com/api/v1/event/%7Bid%7D/meta');
xhr.setRequestHeader('x-rapidapi-key', '8d03599f15msh6a90deb9c31a82ap126f33jsnbbfcead88b09');
xhr.setRequestHeader('x-rapidapi-host', 'sportapi7.p.rapidapi.com');

xhr.send(data);