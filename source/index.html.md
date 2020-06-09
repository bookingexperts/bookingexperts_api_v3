---
title: Booking Experts ContentAPI v1.0.0
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers:
  - <a href="https://www.bookingexperts.nl">Booking Experts</a>
includes:
  - release_notes
search: false
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="booking-experts-contentapi">Booking Experts ContentAPI v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

## Introduction

**DRAFT: this is a draft version and should not be used because this specification will change a lot.**

This API is an interface for querying information from and enacting change inside a Booking Experts administration.
Use it on the fly for ad-hoc needs, or build a Booking Experts App which is exposed to all users of Booking Experts through a marketplace.

If you're a online tour operator, agency or just want to show available accommodations, price etc. you might want to have a look at a more focused API scope, the [Tour operator API](https://tour-operator-api.bookingexperts.com/).

The goal of these API's is to maximize collaboration between all parties involved in leisure.
So in case you think that you miss data or API endpoints, please let us know by sending us a e-mail at [connectivity@bookingexperts.nl](mailto:connectivity@bookingexperts.nl).

## Standards

The Booking Experts API is organized around [REST](http://en.wikipedia.org/wiki/Representational_State_Transfer) and it follows the [JSON API specification](http://jsonapi.org/).
The API has predictable, resource-oriented URLs, and uses HTTP response codes to indicate API errors.

Documentation is standardized by using the [Open API 3 (OAS3) specification](https://swagger.io/specification/), this allows you to inspect the API using other clients like for example Swagger UI and Postman.
The specification is hosted here: `https://api.webhooks.bookingexperts.nl/v3/oas3.json`

## Get acccess

First of you need access to at least one Booking Experts organization.
Inside the administration you can register a new application.

By default this application is only accessible by the administrations of this organization.
Very handy if you want to make a on the fly integration. But when your app is ready for other organizations to use, you can sign-up for validation to the marketplace.

## Basics

### Authorization

You can authorize on behalf of a user by using OAuth2.
For on the fly needs you can make use of a simple authentication token but has limited access to the organization and it's administrations to which is registered.
If you want other to make use of your app you will need to support OAuth2.

### Responses

```shell
curl https://api.bookingexperts.nl/v3/administrations             -H 'Accept: application/vnd.api+json'             -H 'Accept-Language: en,nl'             -H 'X-API-KEY: API_KEY'
```

> Produces the following output

```json
{
  "errors": [
    {
      "status": 401,
      "title": "Unauthorized error",
      "detail": "Please make sure to set the Authorization HTTP header"
    }
  ]
}
```

The Booking Experts API will always respond with a HTTP status code.
The API can return the following codes:

Code  | Semantic             | Meaning
----- | -------              | -------
`200` | OK                   | Request was successful
`400` | Bad Request          | Parameters for the request are missing or malformed. Body contains the errors.
`401` | Unauthorized         | Your API key is wrong
`403` | Forbidden            | IP is blacklisted for API usage, see Throttling information
`404` | Not Found            | Entity not found
`422` | Unprocessable entity | Saving the entity in the database failed due to validation errors. Body contains the errors.
`429` | Too Many Requests    | You're requesting too many kittens! Slow down!
`5XX` | Server Errors        | Something went wrong on Booking Experts's end. We are probably already busy solving the issue. It's your responsibility to retry the request at a later point.

### Accept Language

You can always pass an Accept-Language header containing a comma separated list of locales. This
will limit the result of 'localized' attributes to the locales specified.

### HTTP_X_BE_SIGNATURE header

When your application receives a request from Booking Experts, for example when a webhook or application command is called, the `HTTP_X_BE_SIGNATURE`
is passed to allow you to verify that the request was sent by our systems. It uses a HMAC hexdigest to compute the hash based on your Client Secret.

To verify a request, your code should like something like this:

```ruby
def verify_signature(payload_body)
  signature = 'sha1=' + OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha1'), ENV['OAUTH_CLIENT_SECRET'], payload_body)
  return halt 500, "Signatures didn't match!" unless Rack::Utils.secure_compare(signature, request.env['HTTP_X_BE_SIGNATURE'])
end
```
@TODO curl example (is this even possible?)
@TODO python example
@TODO php example

* No matter which implementation you use, the hash signature starts with sha1=, using the key of your Client Secret and your payload body.
* Using a plain == operator is not advised. A method like secure_compare performs a "constant time" string comparison, which renders it safe from certain timing attacks against regular equality operators.

### Throttling

Usage of the Booking Experts API is virtually unlimited. However, to prevent fraud and abuse, requests to the API are throttled.
By default you are allowed to call the API 500 times within a moving window of 15 minutes. Additionally, bursts of 100 calls per minute are allowed within this window.

While within the limit, each response contains a `X-RateLimit-Limit` and a `X-RateLimit-Remaining` header containing the set limit & the remaining allowance in the window.
If you exceed the limit, the API will respond with a 429 Too many requests response. This response contains a header Retry-After containing the time after which a new calls are allowed.

If your use case requires more lenient rate limits, please contact us at [connectivity@bookingexperts.nl](mailto:connectivity@bookingexperts.nl) to request a higher limit.

### Pagination

@TODO

### Field sets

@TODO

### Filters

The following attribute filters are available on GET API calls:

- `attr=term`: attr = 'term'
- `attr=~term`: attr LIKE '%term%'
- `attr=term,term`: attr IN ('term', 'term')
- `attr=a..b`: BETWEEN 'a' AND 'b'

All expressions can be inverted by prefixing a `!`, this holds for the entire expression.

## Use cases

There are many use cases of this API that we are aware of:

- Access control
- Thermostats
- Channel management
- Tour operators
- Websites
- Payment providers
- etc.

Some use cases are quite specific.

### Payment provider

#### Payment provider requirements

Apps that act as a payment provider **must** provide an application command with identifier `initiate_payment` and context model `invoice`.
When this command is called, you will receive the following (additional) parameters:

* `amount` - The requested amount to be paid
* `currency` - The currency of the amount as an ISO 4217 currency code

The response of this command **must** be a redirect URL to a payment page when no issues occur, otherwise it should return a notice or an alert.

#### Handling a payment

* The redirect URL you have specified will be called with a `back_url`, which should be called after a payment attempt has been done
* The app itself must handle all callbacks and create a payment in Booking Experts when the invoice has been paid
* After (partial) payment, the `back_url` **must** be called with a `status` parameter, which is set to one of the following values:
  * `success` - when the payment was successful
  * `open_but_confirmed` - when a payment has been made, but is still pending
  * `open` - when no payment has been made yet
  * `failure` - when the payment failed

Base URLs:

* <a href="https://api.bookingexperts.nl">https://api.bookingexperts.nl</a>

* <a href="https://api.staging.bookingexperts.nl">https://api.staging.bookingexperts.nl</a>

Email: <a href="mailto:connectivity@bookingexperts.nl">Connectivity team</a> Web: <a href="developers.bookingexperts.nl/contact">Connectivity team</a> 

# Authentication

* API Key (ApiKeyAuth)
    - Parameter Name: **X-API-KEY**, in: header. 

- oAuth2 authentication. 

    - Flow: authorizationCode
    - Authorization URL = [/oauth/authorize](/oauth/authorize)
    - Token URL = [/oauth/token](/oauth/token)

|Scope|Scope Description|
|---|---|
|accommodation_subtype|read|Read accommodation subtypes|
|administration|read|Read administrations|
|agenda_period|read|Read blocked periods|
|area_type|read|Read floors|
|arrival_checkout_date|read|Read arrival / checkout dates|
|category_group|read|Read type groups|
|category|read|Read types|
|channel|read|Read channels|
|city|read|Read cities|
|cost|read|Read costs|
|currency_conversion|read|Read currency conversions|
|discount_action|read|Read discount actions|
|extra|read|Read extras|
|invoice|read|Read invoices|
|order|read|Read orders|
|organization|read|Read organizations|
|package_entry|read|Read costs|
|package|read|Read packages|
|payment_method|read|Read payment methods|
|payment|read|Read payments|
|payment|write|Update payments|
|period|read|Read period groups|
|region|read|Read regions|
|rentable_identity|read|Read accommodations|
|rentable|read|Read accommodations|
|reservation|read|Read reservations|
|review|read|Read reviews|
|room_type|read|Read room types|
|room|read|Read rooms|
|subscription|read|Read subscriptions|
|terms|read|Read terms  and conditions|

<h1 id="booking-experts-contentapi-administrations">Administrations</h1>

## GET administrations

<a id="opIdAdministrations_Index"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations`

Returns all administrations accessible for the current subscription

<h3 id="get-administrations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page[number]|query|string|false|Page number|
|page[size]|query|string|false|Page size|
|sort|query|string|false|Sort. Specify a comma separated list of attributes to sort on. Prefix attribute with a \- to sort in descending order|
|fields[administration]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[name]|query|string|false|Filter on name|
|filter[phone]|query|string|false|Filter on phone|
|filter[website]|query|string|false|Filter on website|
|filter[description]|query|string|false|Filter on description|
|filter[surroundings_description]|query|string|false|Filter on surroundings_description|
|filter[available_locales]|query|string|false|Filter on available_locales|
|filter[utc_offset]|query|string|false|Filter on utc_offset|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": [
    {
      "id": "1",
      "type": "administration",
      "attributes": {
        "name": "string",
        "phone": "string",
        "website": "string",
        "description": {
          "nl": "string",
          "en": "string",
          "de": "string",
          "fr": "string",
          "da": "string",
          "cs": "string",
          "es": "string",
          "tr": "string",
          "pt": "string",
          "it": "string"
        },
        "surroundings_description": {
          "nl": "string",
          "en": "string",
          "de": "string",
          "fr": "string",
          "da": "string",
          "cs": "string",
          "es": "string",
          "tr": "string",
          "pt": "string",
          "it": "string"
        },
        "available_locales": [
          "string"
        ],
        "utc_offset": "string"
      },
      "links": {
        "self": "string"
      }
    }
  ],
  "meta": {
    "pagination": {
      "total_records": 0,
      "page": 0,
      "size": 0
    }
  }
}
```

<h3 id="get-administrations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|AdministrationCollectionResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-administrations-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[[Administration](#schemaadministration)]|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» name|string|false|none|none|
|»»» phone|string|false|none|none|
|»»» website|string|false|none|none|
|»»» description|object|false|none|A description of the administration|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» surroundings_description|object|false|none|A description of the surroundings|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» available_locales|[string]|false|none|Enabled locales|
|»»» utc_offset|string|false|none|The UTC offset of the administration, for example: +01:00|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|
|» meta|object|false|none|none|
|»» pagination|object|false|none|none|
|»»» total_records|integer|false|none|none|
|»»» page|integer|false|none|none|
|»»» size|integer|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## GET administration

<a id="opIdAdministrations_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations/{id}`

Returns an administration of the current organization

<h3 id="get-administration-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Resource ID|
|fields[administration]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[name]|query|string|false|Filter on name|
|filter[phone]|query|string|false|Filter on phone|
|filter[website]|query|string|false|Filter on website|
|filter[description]|query|string|false|Filter on description|
|filter[surroundings_description]|query|string|false|Filter on surroundings_description|
|filter[available_locales]|query|string|false|Filter on available_locales|
|filter[utc_offset]|query|string|false|Filter on utc_offset|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "administration",
    "attributes": {
      "name": "string",
      "phone": "string",
      "website": "string",
      "description": {
        "nl": "string",
        "en": "string",
        "de": "string",
        "fr": "string",
        "da": "string",
        "cs": "string",
        "es": "string",
        "tr": "string",
        "pt": "string",
        "it": "string"
      },
      "surroundings_description": {
        "nl": "string",
        "en": "string",
        "de": "string",
        "fr": "string",
        "da": "string",
        "cs": "string",
        "es": "string",
        "tr": "string",
        "pt": "string",
        "it": "string"
      },
      "available_locales": [
        "string"
      ],
      "utc_offset": "string"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="get-administration-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|AdministrationResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-administration-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Administration](#schemaadministration)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» name|string|false|none|none|
|»»» phone|string|false|none|none|
|»»» website|string|false|none|none|
|»»» description|object|false|none|A description of the administration|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» surroundings_description|object|false|none|A description of the surroundings|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» available_locales|[string]|false|none|Enabled locales|
|»»» utc_offset|string|false|none|The UTC offset of the administration, for example: +01:00|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-application-commands">Application Commands</h1>

Create commands which can be accessed by the user through the user interface. The action will be accessible for a resource.

When a user triggers the command from the user interface Booking Experts will call the `target_url` on which your app should respond back. This response is rendered to the user.

Example use cases:

- As a user I should be able to open the gate by pressing a button inside Booking Experts.
- As a user I should be able to configure the payment provider integration inside Booking Experts.

## GET application commands

<a id="opIdApplication Commands_Index"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/application_commands \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/application_commands HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/application_commands");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/application_commands")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/application_commands", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/application_commands",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/application_commands")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/application_commands"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/application_commands`

Returns application commands you have registered

<h3 id="get-application-commands-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page[number]|query|string|false|Page number|
|page[size]|query|string|false|Page size|
|sort|query|string|false|Sort. Specify a comma separated list of attributes to sort on. Prefix attribute with a \- to sort in descending order|
|fields[application_command]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[identifier]|query|string|false|Filter on identifier|
|filter[name]|query|string|false|Filter on name|
|filter[description]|query|string|false|Filter on description|
|filter[context_model]|query|string|false|Filter on context_model|
|filter[http_method]|query|string|false|Filter on http_method|
|filter[target_url]|query|string|false|Filter on target_url|
|filter[enabled_script]|query|string|false|Filter on enabled_script|
|filter[created_at]|query|string|false|Filter on created_at|
|filter[updated_at]|query|string|false|Filter on updated_at|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": [
    {
      "id": "1",
      "type": "application_command",
      "attributes": {
        "identifier": "create_cards",
        "name": {
          "en": "Create gate cards",
          "nl": "Toegangskaarten maken"
        },
        "description": {
          "en": "Create gate cards for this gate system",
          "nl": "Toegangskaarten maken voor dit toegangssysteem"
        },
        "context_model": "reservation",
        "http_method": "post",
        "target_url": "https://myapp.lvh.me:3000/gate_cards",
        "enabled_script": "reservation.dig(:data, :attributes, :state) == 'confirmed'",
        "created_at": "2020-06-09T07:58:26Z",
        "updated_at": "2020-06-09T07:58:26Z"
      },
      "links": {
        "self": "string"
      }
    }
  ],
  "meta": {
    "pagination": {
      "total_records": 0,
      "page": 0,
      "size": 0
    }
  }
}
```

<h3 id="get-application-commands-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ApplicationCommandCollectionResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-application-commands-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[[ApplicationCommand](#schemaapplicationcommand)]|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» identifier|string|false|none|none|
|»»» name|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» description|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» context_model|string|false|none|One of: invoice, reservation, subscription|
|»»» http_method|string|false|none|One of: get, post, put, patch, delete|
|»»» target_url|string|false|none|This URL will be called by us using the `http_method` specified|
|»»» enabled_script|string|false|none|When set, this script will be evaluated to determine whether an action should be available to a user.<br>The last line of your script will be the result of the script. When the result is truthy, the command will be enabled.<br>The following variables will be available to you:<br><br>* The JSON serialized context model as defined in `context_model`. For example: `reservation`. Conforms to the documented schema.<br>* `current_user` - The JSON serialized current user (when present). Conforms to the documented User schema.<br><br>The script language **MUST** be Ruby. The list of method calls you are allowed to make is limited to the following:<br><br>* Allowed methods on any object:<br>`==` `!=` `!` `present?` `blank?`<br>* Allowed methods on hash objects:<br>`[]` `dig`<br>* Allowed calculation methods:<br>`+` `-` `*` `/`|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|
|» meta|object|false|none|none|
|»» pagination|object|false|none|none|
|»»» total_records|integer|false|none|none|
|»»» page|integer|false|none|none|
|»»» size|integer|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## POST application command

<a id="opIdApplication Commands_Create"></a>

> Code samples

```shell
curl --request POST \
  --url https://api.bookingexperts.nl/v3/application_commands \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'content-type: application/vnd.api+json' \
  --header 'x-api-key: API_KEY' \
  --data '{"data":{"type":"application_command","attributes":{"identifier":"create_cards","name":{"en":"Create gate cards","nl":"Toegangskaarten maken"},"description":{"en":"Create gate cards for this gate system","nl":"Toegangskaarten maken voor dit toegangssysteem"},"context_model":"reservation","http_method":"post","target_url":"https://myapp.lvh.me:3000/gate_cards","enabled_script":"reservation.dig(:data, :attributes, :state) == '\''confirmed'\''"}}}'
```

```http
POST /v3/application_commands HTTP/1.1
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl
Content-Length: 442

{"data":{"type":"application_command","attributes":{"identifier":"create_cards","name":{"en":"Create gate cards","nl":"Toegangskaarten maken"},"description":{"en":"Create gate cards for this gate system","nl":"Toegangskaarten maken voor dit toegangssysteem"},"context_model":"reservation","http_method":"post","target_url":"https://myapp.lvh.me:3000/gate_cards","enabled_script":"reservation.dig(:data, :attributes, :state) == 'confirmed'"}}}
```

```javascript
var data = "{\"data\":{\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}";

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "https://api.bookingexperts.nl/v3/application_commands");
xhr.setRequestHeader("content-type", "application/vnd.api+json");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/application_commands")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Post.new(url)
request["content-type"] = 'application/vnd.api+json'
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'
request.body = "{\"data\":{\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}"

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

payload = "{\"data\":{\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}"

headers = {
    'content-type': "application/vnd.api+json",
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("POST", "/v3/application_commands", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/application_commands",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => "{\"data\":{\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "content-type: application/vnd.api+json",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.post("https://api.bookingexperts.nl/v3/application_commands")
  .header("content-type", "application/vnd.api+json")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .body("{\"data\":{\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}")
  .asString();
```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/application_commands"

	payload := strings.NewReader("{\"data\":{\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("content-type", "application/vnd.api+json")
	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`POST /v3/application_commands`

Create a new application command.

Application commands **MUST** respond with one of the following **JSON** responses when its `target_url` is called:

* Redirect URL<br>
  `{ "redirect_url": "http://localhost:3000/page" }`
* I-frame URL<br>
  `{ "iframe_url": "http://localhost:3000/page" }`
* Notice message<br>
  `{ "notice": "Great success!" }`
* Alert message<br>
  `{ "alert": "Something went wrong!" }`

> Body parameter

```json
{
  "data": {
    "type": "application_command",
    "attributes": {
      "identifier": "create_cards",
      "name": {
        "en": "Create gate cards",
        "nl": "Toegangskaarten maken"
      },
      "description": {
        "en": "Create gate cards for this gate system",
        "nl": "Toegangskaarten maken voor dit toegangssysteem"
      },
      "context_model": "reservation",
      "http_method": "post",
      "target_url": "https://myapp.lvh.me:3000/gate_cards",
      "enabled_script": "reservation.dig(:data, :attributes, :state) == 'confirmed'"
    }
  }
}
```

<h3 id="post-application-command-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|
|body|body|object|true|none|
|» data|body|object|false|none|
|»» type|body|string|false|Type|
|»» attributes|body|object|false|Attributes|
|»»» identifier|body|string|false|none|
|»»» name|body|object|false|none|
|»»»» nl|body|string|false|none|
|»»»» en|body|string|false|none|
|»»»» de|body|string|false|none|
|»»»» fr|body|string|false|none|
|»»»» da|body|string|false|none|
|»»»» cs|body|string|false|none|
|»»»» es|body|string|false|none|
|»»»» tr|body|string|false|none|
|»»»» pt|body|string|false|none|
|»»»» it|body|string|false|none|
|»»» description|body|object|false|none|
|»»»» nl|body|string|false|none|
|»»»» en|body|string|false|none|
|»»»» de|body|string|false|none|
|»»»» fr|body|string|false|none|
|»»»» da|body|string|false|none|
|»»»» cs|body|string|false|none|
|»»»» es|body|string|false|none|
|»»»» tr|body|string|false|none|
|»»»» pt|body|string|false|none|
|»»»» it|body|string|false|none|
|»»» context_model|body|string|false|One of: invoice, reservation, subscription|
|»»» http_method|body|string|false|One of: get, post, put, patch, delete|
|»»» target_url|body|string|false|This URL will be called by us using the `http_method` specified|
|»»» enabled_script|body|string|false|When set, this script will be evaluated to determine whether an action should be available to a user.|

#### Detailed descriptions

**»»» enabled_script**: When set, this script will be evaluated to determine whether an action should be available to a user.
The last line of your script will be the result of the script. When the result is truthy, the command will be enabled.
The following variables will be available to you:

* The JSON serialized context model as defined in `context_model`. For example: `reservation`. Conforms to the documented schema.
* `current_user` - The JSON serialized current user (when present). Conforms to the documented User schema.

The script language **MUST** be Ruby. The list of method calls you are allowed to make is limited to the following:

* Allowed methods on any object:
`==` `!=` `!` `present?` `blank?`
* Allowed methods on hash objects:
`[]` `dig`
* Allowed calculation methods:
`+` `-` `*` `/`

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "application_command",
    "attributes": {
      "identifier": "create_cards",
      "name": {
        "en": "Create gate cards",
        "nl": "Toegangskaarten maken"
      },
      "description": {
        "en": "Create gate cards for this gate system",
        "nl": "Toegangskaarten maken voor dit toegangssysteem"
      },
      "context_model": "reservation",
      "http_method": "post",
      "target_url": "https://myapp.lvh.me:3000/gate_cards",
      "enabled_script": "reservation.dig(:data, :attributes, :state) == 'confirmed'",
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="post-application-command-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ApplicationCommandResponse|Inline|
|default|Default|Error|Inline|

<h3 id="post-application-command-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[ApplicationCommand](#schemaapplicationcommand)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» identifier|string|false|none|none|
|»»» name|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» description|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» context_model|string|false|none|One of: invoice, reservation, subscription|
|»»» http_method|string|false|none|One of: get, post, put, patch, delete|
|»»» target_url|string|false|none|This URL will be called by us using the `http_method` specified|
|»»» enabled_script|string|false|none|When set, this script will be evaluated to determine whether an action should be available to a user.<br>The last line of your script will be the result of the script. When the result is truthy, the command will be enabled.<br>The following variables will be available to you:<br><br>* The JSON serialized context model as defined in `context_model`. For example: `reservation`. Conforms to the documented schema.<br>* `current_user` - The JSON serialized current user (when present). Conforms to the documented User schema.<br><br>The script language **MUST** be Ruby. The list of method calls you are allowed to make is limited to the following:<br><br>* Allowed methods on any object:<br>`==` `!=` `!` `present?` `blank?`<br>* Allowed methods on hash objects:<br>`[]` `dig`<br>* Allowed calculation methods:<br>`+` `-` `*` `/`|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## GET application command

<a id="opIdApplication Commands_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/application_commands/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/application_commands/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/application_commands/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/application_commands/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/application_commands/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/application_commands/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/application_commands/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/application_commands/string"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/application_commands/{id}`

Returns the application command for the given ID

<h3 id="get-application-command-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Resource ID|
|fields[application_command]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[identifier]|query|string|false|Filter on identifier|
|filter[name]|query|string|false|Filter on name|
|filter[description]|query|string|false|Filter on description|
|filter[context_model]|query|string|false|Filter on context_model|
|filter[http_method]|query|string|false|Filter on http_method|
|filter[target_url]|query|string|false|Filter on target_url|
|filter[enabled_script]|query|string|false|Filter on enabled_script|
|filter[created_at]|query|string|false|Filter on created_at|
|filter[updated_at]|query|string|false|Filter on updated_at|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "application_command",
    "attributes": {
      "identifier": "create_cards",
      "name": {
        "en": "Create gate cards",
        "nl": "Toegangskaarten maken"
      },
      "description": {
        "en": "Create gate cards for this gate system",
        "nl": "Toegangskaarten maken voor dit toegangssysteem"
      },
      "context_model": "reservation",
      "http_method": "post",
      "target_url": "https://myapp.lvh.me:3000/gate_cards",
      "enabled_script": "reservation.dig(:data, :attributes, :state) == 'confirmed'",
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="get-application-command-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ApplicationCommandResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-application-command-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[ApplicationCommand](#schemaapplicationcommand)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» identifier|string|false|none|none|
|»»» name|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» description|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» context_model|string|false|none|One of: invoice, reservation, subscription|
|»»» http_method|string|false|none|One of: get, post, put, patch, delete|
|»»» target_url|string|false|none|This URL will be called by us using the `http_method` specified|
|»»» enabled_script|string|false|none|When set, this script will be evaluated to determine whether an action should be available to a user.<br>The last line of your script will be the result of the script. When the result is truthy, the command will be enabled.<br>The following variables will be available to you:<br><br>* The JSON serialized context model as defined in `context_model`. For example: `reservation`. Conforms to the documented schema.<br>* `current_user` - The JSON serialized current user (when present). Conforms to the documented User schema.<br><br>The script language **MUST** be Ruby. The list of method calls you are allowed to make is limited to the following:<br><br>* Allowed methods on any object:<br>`==` `!=` `!` `present?` `blank?`<br>* Allowed methods on hash objects:<br>`[]` `dig`<br>* Allowed calculation methods:<br>`+` `-` `*` `/`|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## PATCH application command

<a id="opIdApplication Commands_Update"></a>

> Code samples

```shell
curl --request PATCH \
  --url https://api.bookingexperts.nl/v3/application_commands/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'content-type: application/vnd.api+json' \
  --header 'x-api-key: API_KEY' \
  --data '{"data":{"id":"1","type":"application_command","attributes":{"identifier":"create_cards","name":{"en":"Create gate cards","nl":"Toegangskaarten maken"},"description":{"en":"Create gate cards for this gate system","nl":"Toegangskaarten maken voor dit toegangssysteem"},"context_model":"reservation","http_method":"post","target_url":"https://myapp.lvh.me:3000/gate_cards","enabled_script":"reservation.dig(:data, :attributes, :state) == '\''confirmed'\''"}}}'
```

```http
PATCH /v3/application_commands/string HTTP/1.1
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl
Content-Length: 451

{"data":{"id":"1","type":"application_command","attributes":{"identifier":"create_cards","name":{"en":"Create gate cards","nl":"Toegangskaarten maken"},"description":{"en":"Create gate cards for this gate system","nl":"Toegangskaarten maken voor dit toegangssysteem"},"context_model":"reservation","http_method":"post","target_url":"https://myapp.lvh.me:3000/gate_cards","enabled_script":"reservation.dig(:data, :attributes, :state) == 'confirmed'"}}}
```

```javascript
var data = "{\"data\":{\"id\":\"1\",\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}";

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("PATCH", "https://api.bookingexperts.nl/v3/application_commands/string");
xhr.setRequestHeader("content-type", "application/vnd.api+json");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/application_commands/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Patch.new(url)
request["content-type"] = 'application/vnd.api+json'
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'
request.body = "{\"data\":{\"id\":\"1\",\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}"

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

payload = "{\"data\":{\"id\":\"1\",\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}"

headers = {
    'content-type': "application/vnd.api+json",
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("PATCH", "/v3/application_commands/string", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/application_commands/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "PATCH",
  CURLOPT_POSTFIELDS => "{\"data\":{\"id\":\"1\",\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "content-type: application/vnd.api+json",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.patch("https://api.bookingexperts.nl/v3/application_commands/string")
  .header("content-type", "application/vnd.api+json")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .body("{\"data\":{\"id\":\"1\",\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}")
  .asString();
```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/application_commands/string"

	payload := strings.NewReader("{\"data\":{\"id\":\"1\",\"type\":\"application_command\",\"attributes\":{\"identifier\":\"create_cards\",\"name\":{\"en\":\"Create gate cards\",\"nl\":\"Toegangskaarten maken\"},\"description\":{\"en\":\"Create gate cards for this gate system\",\"nl\":\"Toegangskaarten maken voor dit toegangssysteem\"},\"context_model\":\"reservation\",\"http_method\":\"post\",\"target_url\":\"https://myapp.lvh.me:3000/gate_cards\",\"enabled_script\":\"reservation.dig(:data, :attributes, :state) == 'confirmed'\"}}}")

	req, _ := http.NewRequest("PATCH", url, payload)

	req.Header.Add("content-type", "application/vnd.api+json")
	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`PATCH /v3/application_commands/{id}`

Update an application command

> Body parameter

```json
{
  "data": {
    "id": "1",
    "type": "application_command",
    "attributes": {
      "identifier": "create_cards",
      "name": {
        "en": "Create gate cards",
        "nl": "Toegangskaarten maken"
      },
      "description": {
        "en": "Create gate cards for this gate system",
        "nl": "Toegangskaarten maken voor dit toegangssysteem"
      },
      "context_model": "reservation",
      "http_method": "post",
      "target_url": "https://myapp.lvh.me:3000/gate_cards",
      "enabled_script": "reservation.dig(:data, :attributes, :state) == 'confirmed'"
    }
  }
}
```

<h3 id="patch-application-command-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Resource ID|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|
|body|body|object|true|none|
|» data|body|object|false|none|
|»» id|body|string|false|ID|
|»» type|body|string|false|Type|
|»» attributes|body|object|false|Attributes|
|»»» identifier|body|string|false|none|
|»»» name|body|object|false|none|
|»»»» nl|body|string|false|none|
|»»»» en|body|string|false|none|
|»»»» de|body|string|false|none|
|»»»» fr|body|string|false|none|
|»»»» da|body|string|false|none|
|»»»» cs|body|string|false|none|
|»»»» es|body|string|false|none|
|»»»» tr|body|string|false|none|
|»»»» pt|body|string|false|none|
|»»»» it|body|string|false|none|
|»»» description|body|object|false|none|
|»»»» nl|body|string|false|none|
|»»»» en|body|string|false|none|
|»»»» de|body|string|false|none|
|»»»» fr|body|string|false|none|
|»»»» da|body|string|false|none|
|»»»» cs|body|string|false|none|
|»»»» es|body|string|false|none|
|»»»» tr|body|string|false|none|
|»»»» pt|body|string|false|none|
|»»»» it|body|string|false|none|
|»»» context_model|body|string|false|One of: invoice, reservation, subscription|
|»»» http_method|body|string|false|One of: get, post, put, patch, delete|
|»»» target_url|body|string|false|This URL will be called by us using the `http_method` specified|
|»»» enabled_script|body|string|false|When set, this script will be evaluated to determine whether an action should be available to a user.|

#### Detailed descriptions

**»»» enabled_script**: When set, this script will be evaluated to determine whether an action should be available to a user.
The last line of your script will be the result of the script. When the result is truthy, the command will be enabled.
The following variables will be available to you:

* The JSON serialized context model as defined in `context_model`. For example: `reservation`. Conforms to the documented schema.
* `current_user` - The JSON serialized current user (when present). Conforms to the documented User schema.

The script language **MUST** be Ruby. The list of method calls you are allowed to make is limited to the following:

* Allowed methods on any object:
`==` `!=` `!` `present?` `blank?`
* Allowed methods on hash objects:
`[]` `dig`
* Allowed calculation methods:
`+` `-` `*` `/`

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "application_command",
    "attributes": {
      "identifier": "create_cards",
      "name": {
        "en": "Create gate cards",
        "nl": "Toegangskaarten maken"
      },
      "description": {
        "en": "Create gate cards for this gate system",
        "nl": "Toegangskaarten maken voor dit toegangssysteem"
      },
      "context_model": "reservation",
      "http_method": "post",
      "target_url": "https://myapp.lvh.me:3000/gate_cards",
      "enabled_script": "reservation.dig(:data, :attributes, :state) == 'confirmed'",
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="patch-application-command-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ApplicationCommandResponse|Inline|
|default|Default|Error|Inline|

<h3 id="patch-application-command-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[ApplicationCommand](#schemaapplicationcommand)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» identifier|string|false|none|none|
|»»» name|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» description|object|false|none|none|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» context_model|string|false|none|One of: invoice, reservation, subscription|
|»»» http_method|string|false|none|One of: get, post, put, patch, delete|
|»»» target_url|string|false|none|This URL will be called by us using the `http_method` specified|
|»»» enabled_script|string|false|none|When set, this script will be evaluated to determine whether an action should be available to a user.<br>The last line of your script will be the result of the script. When the result is truthy, the command will be enabled.<br>The following variables will be available to you:<br><br>* The JSON serialized context model as defined in `context_model`. For example: `reservation`. Conforms to the documented schema.<br>* `current_user` - The JSON serialized current user (when present). Conforms to the documented User schema.<br><br>The script language **MUST** be Ruby. The list of method calls you are allowed to make is limited to the following:<br><br>* Allowed methods on any object:<br>`==` `!=` `!` `present?` `blank?`<br>* Allowed methods on hash objects:<br>`[]` `dig`<br>* Allowed calculation methods:<br>`+` `-` `*` `/`|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## DELETE application command

<a id="opIdApplication Commands_Destroy"></a>

> Code samples

```shell
curl --request DELETE \
  --url https://api.bookingexperts.nl/v3/application_commands/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
DELETE /v3/application_commands/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("DELETE", "https://api.bookingexperts.nl/v3/application_commands/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/application_commands/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Delete.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("DELETE", "/v3/application_commands/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/application_commands/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "DELETE",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.delete("https://api.bookingexperts.nl/v3/application_commands/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/application_commands/string"

	req, _ := http.NewRequest("DELETE", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`DELETE /v3/application_commands/{id}`

Delete an application command

<h3 id="delete-application-command-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Resource ID|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> default Response

```json
{
  "errors": [
    {
      "status": "string",
      "code": "string",
      "title": "string",
      "detail": "string",
      "source": {
        "pointer": "string"
      }
    }
  ]
}
```

<h3 id="delete-application-command-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Success|None|
|default|Default|Error|Inline|

<h3 id="delete-application-command-responseschema">Response Schema</h3>

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-invoices">Invoices</h1>

## GET invoice

<a id="opIdInvoices_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations/string/invoices/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations/string/invoices/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations/string/invoices/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string/invoices/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations/string/invoices/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string/invoices/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations/string/invoices/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string/invoices/string"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations/{administration_id}/invoices/{id}`

Returns an invoice

<h3 id="get-invoice-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|administration_id|path|string|true|Administration ID|
|id|path|string|true|Resource ID|
|fields[invoice]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[invoice_nr]|query|string|false|Filter on invoice_nr|
|filter[foreign_total]|query|string|false|Filter on foreign_total|
|filter[foreign_total_open]|query|string|false|Filter on foreign_total_open|
|filter[foreign_currency]|query|string|false|Filter on foreign_currency|
|filter[administration]|query|string|false|Filter on administration. Specify a comma separated list of IDs to filter on.|
|filter[reservation]|query|string|false|Filter on reservation. Specify a comma separated list of IDs to filter on.|
|include|query|string|false|Includes list. Specify a comma separated list of resources to include.|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "invoice",
    "attributes": {
      "invoice_nr": "string",
      "foreign_total": 0,
      "foreign_total_open": 0,
      "foreign_currency": "string"
    },
    "links": {
      "self": "string"
    },
    "relationships": {
      "administration": {
        "data": {
          "id": "string",
          "type": "administration"
        },
        "links": {
          "related": "string"
        }
      },
      "reservation": {
        "data": {
          "id": "string",
          "type": "reservation"
        },
        "links": {
          "related": "string"
        }
      }
    }
  }
}
```

<h3 id="get-invoice-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|InvoiceResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-invoice-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Invoice](#schemainvoice)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» invoice_nr|string|false|none|none|
|»»» foreign_total|number(float)|false|none|none|
|»»» foreign_total_open|number(float)|false|none|none|
|»»» foreign_currency|string|false|none|An ISO 4217 currency code|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|
|»» relationships|object|false|none|Relationships|
|»»» administration|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|administration ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|
|»»» reservation|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|reservation ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-orders">Orders</h1>

## GET order

<a id="opIdOrders_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations/string/orders/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations/string/orders/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations/string/orders/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string/orders/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations/string/orders/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string/orders/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations/string/orders/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string/orders/string"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations/{administration_id}/orders/{id}`

Returns an order of a reservation

<h3 id="get-order-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|administration_id|path|string|true|Administration ID|
|id|path|string|true|Resource ID|
|fields[order]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[reservation_days]|query|string|false|Filter on reservation_days|
|filter[packaged_date_range]|query|string|false|Filter on packaged_date_range|
|filter[primary_package_id]|query|string|false|Filter on primary_package_id|
|filter[extra_package_ids]|query|string|false|Filter on extra_package_ids|
|filter[currency]|query|string|false|Filter on currency|
|filter[total]|query|string|false|Filter on total|
|filter[administration]|query|string|false|Filter on administration. Specify a comma separated list of IDs to filter on.|
|filter[main_order_items]|query|string|false|Filter on main_order_items. Specify a comma separated list of IDs to filter on.|
|filter[extra_order_items]|query|string|false|Filter on extra_order_items. Specify a comma separated list of IDs to filter on.|
|include|query|string|false|Includes list. Specify a comma separated list of resources to include.|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "administration",
    "attributes": {
      "name": "string",
      "phone": "string",
      "website": "string",
      "description": {
        "nl": "string",
        "en": "string",
        "de": "string",
        "fr": "string",
        "da": "string",
        "cs": "string",
        "es": "string",
        "tr": "string",
        "pt": "string",
        "it": "string"
      },
      "surroundings_description": {
        "nl": "string",
        "en": "string",
        "de": "string",
        "fr": "string",
        "da": "string",
        "cs": "string",
        "es": "string",
        "tr": "string",
        "pt": "string",
        "it": "string"
      },
      "available_locales": [
        "string"
      ],
      "utc_offset": "string"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="get-order-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|AdministrationResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-order-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Administration](#schemaadministration)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» name|string|false|none|none|
|»»» phone|string|false|none|none|
|»»» website|string|false|none|none|
|»»» description|object|false|none|A description of the administration|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» surroundings_description|object|false|none|A description of the surroundings|
|»»»» nl|string|false|none|none|
|»»»» en|string|false|none|none|
|»»»» de|string|false|none|none|
|»»»» fr|string|false|none|none|
|»»»» da|string|false|none|none|
|»»»» cs|string|false|none|none|
|»»»» es|string|false|none|none|
|»»»» tr|string|false|none|none|
|»»»» pt|string|false|none|none|
|»»»» it|string|false|none|none|
|»»» available_locales|[string]|false|none|Enabled locales|
|»»» utc_offset|string|false|none|The UTC offset of the administration, for example: +01:00|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-organizations">Organizations</h1>

## GET organization

<a id="opIdOrganizations_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/organization \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/organization HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/organization");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/organization")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/organization", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/organization",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/organization")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/organization"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/organization`

Returns the current organization

<h3 id="get-organization-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|fields[organization]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[name]|query|string|false|Filter on name|
|filter[website]|query|string|false|Filter on website|
|filter[country_code]|query|string|false|Filter on country_code|
|filter[phone]|query|string|false|Filter on phone|
|filter[email]|query|string|false|Filter on email|
|filter[weekend_behavior]|query|string|false|Filter on weekend_behavior|
|filter[max_baby_age]|query|string|false|Filter on max_baby_age|
|filter[max_child_age]|query|string|false|Filter on max_child_age|
|filter[max_adolescent_age]|query|string|false|Filter on max_adolescent_age|
|filter[min_senior_age]|query|string|false|Filter on min_senior_age|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "organization",
    "attributes": {
      "name": "string",
      "website": "string",
      "country_code": "string",
      "phone": "string",
      "email": "string",
      "weekend_behavior": "string",
      "max_baby_age": 0,
      "max_child_age": 0,
      "max_adolescent_age": 0,
      "min_senior_age": 0
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="get-organization-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OrganizationResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-organization-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Organization](#schemaorganization)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» name|string|false|none|none|
|»»» website|string|false|none|none|
|»»» country_code|string|false|none|none|
|»»» phone|string|false|none|none|
|»»» email|string|false|none|none|
|»»» weekend_behavior|string|false|none|none|
|»»» max_baby_age|integer|false|none|none|
|»»» max_child_age|integer|false|none|none|
|»»» max_adolescent_age|integer|false|none|none|
|»»» min_senior_age|integer|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-payments">Payments</h1>

## GET payments

<a id="opIdPayments_Index"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations/string/payments \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations/string/payments HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations/string/payments");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string/payments")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations/string/payments", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string/payments",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations/string/payments")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string/payments"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations/{administration_id}/payments`

Returns the payments you have registered

<h3 id="get-payments-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|administration_id|path|string|true|Administration ID|
|page[number]|query|string|false|Page number|
|page[size]|query|string|false|Page size|
|sort|query|string|false|Sort. Specify a comma separated list of attributes to sort on. Prefix attribute with a \- to sort in descending order|
|fields[payment]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[paid_at]|query|string|false|Filter on paid_at|
|filter[foreign_price]|query|string|false|Filter on foreign_price|
|filter[memo]|query|string|false|Filter on memo|
|filter[invoice]|query|string|false|Filter on invoice. Specify a comma separated list of IDs to filter on.|
|include|query|string|false|Includes list. Specify a comma separated list of resources to include.|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": [
    {
      "id": "1",
      "type": "payment",
      "attributes": {
        "paid_at": "2020-06-09",
        "foreign_price": 0,
        "memo": "string"
      },
      "relationships": {
        "invoice": {
          "data": {
            "id": "string",
            "type": "invoice"
          },
          "links": {
            "related": "string"
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "total_records": 0,
      "page": 0,
      "size": 0
    }
  }
}
```

<h3 id="get-payments-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|PaymentCollectionResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-payments-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[[Payment](#schemapayment)]|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» paid_at|string(date)|false|none|Local payment date|
|»»» foreign_price|number(float)|false|none|Paid price in the same currency as the invoice currency|
|»»» memo|string|false|none|An optional note|
|»» relationships|object|false|none|Relationships|
|»»» invoice|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|invoice ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|
|» meta|object|false|none|none|
|»» pagination|object|false|none|none|
|»»» total_records|integer|false|none|none|
|»»» page|integer|false|none|none|
|»»» size|integer|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## POST payment

<a id="opIdPayments_Create"></a>

> Code samples

```shell
curl --request POST \
  --url https://api.bookingexperts.nl/v3/administrations/string/payments \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'content-type: application/vnd.api+json' \
  --header 'x-api-key: API_KEY' \
  --data '{"data":{"type":"payment","attributes":{"paid_at":"2020-06-09","foreign_price":0,"memo":"string"},"relationships":{"invoice":{"data":{"id":"string","type":"invoice"},"links":{"related":"string"}}}}}'
```

```http
POST /v3/administrations/string/payments HTTP/1.1
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl
Content-Length: 198

{"data":{"type":"payment","attributes":{"paid_at":"2020-06-09","foreign_price":0,"memo":"string"},"relationships":{"invoice":{"data":{"id":"string","type":"invoice"},"links":{"related":"string"}}}}}
```

```javascript
var data = "{\"data\":{\"type\":\"payment\",\"attributes\":{\"paid_at\":\"2020-06-09\",\"foreign_price\":0,\"memo\":\"string\"},\"relationships\":{\"invoice\":{\"data\":{\"id\":\"string\",\"type\":\"invoice\"},\"links\":{\"related\":\"string\"}}}}}";

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "https://api.bookingexperts.nl/v3/administrations/string/payments");
xhr.setRequestHeader("content-type", "application/vnd.api+json");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string/payments")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Post.new(url)
request["content-type"] = 'application/vnd.api+json'
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'
request.body = "{\"data\":{\"type\":\"payment\",\"attributes\":{\"paid_at\":\"2020-06-09\",\"foreign_price\":0,\"memo\":\"string\"},\"relationships\":{\"invoice\":{\"data\":{\"id\":\"string\",\"type\":\"invoice\"},\"links\":{\"related\":\"string\"}}}}}"

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

payload = "{\"data\":{\"type\":\"payment\",\"attributes\":{\"paid_at\":\"2020-06-09\",\"foreign_price\":0,\"memo\":\"string\"},\"relationships\":{\"invoice\":{\"data\":{\"id\":\"string\",\"type\":\"invoice\"},\"links\":{\"related\":\"string\"}}}}}"

headers = {
    'content-type': "application/vnd.api+json",
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("POST", "/v3/administrations/string/payments", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string/payments",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => "{\"data\":{\"type\":\"payment\",\"attributes\":{\"paid_at\":\"2020-06-09\",\"foreign_price\":0,\"memo\":\"string\"},\"relationships\":{\"invoice\":{\"data\":{\"id\":\"string\",\"type\":\"invoice\"},\"links\":{\"related\":\"string\"}}}}}",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "content-type: application/vnd.api+json",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.post("https://api.bookingexperts.nl/v3/administrations/string/payments")
  .header("content-type", "application/vnd.api+json")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .body("{\"data\":{\"type\":\"payment\",\"attributes\":{\"paid_at\":\"2020-06-09\",\"foreign_price\":0,\"memo\":\"string\"},\"relationships\":{\"invoice\":{\"data\":{\"id\":\"string\",\"type\":\"invoice\"},\"links\":{\"related\":\"string\"}}}}}")
  .asString();
```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string/payments"

	payload := strings.NewReader("{\"data\":{\"type\":\"payment\",\"attributes\":{\"paid_at\":\"2020-06-09\",\"foreign_price\":0,\"memo\":\"string\"},\"relationships\":{\"invoice\":{\"data\":{\"id\":\"string\",\"type\":\"invoice\"},\"links\":{\"related\":\"string\"}}}}}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("content-type", "application/vnd.api+json")
	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`POST /v3/administrations/{administration_id}/payments`

Create a new payment

> Body parameter

```json
{
  "data": {
    "type": "payment",
    "attributes": {
      "paid_at": "2020-06-09",
      "foreign_price": 0,
      "memo": "string"
    },
    "relationships": {
      "invoice": {
        "data": {
          "id": "string",
          "type": "invoice"
        },
        "links": {
          "related": "string"
        }
      }
    }
  }
}
```

<h3 id="post-payment-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|administration_id|path|string|true|Administration ID|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|
|send_notification|query|boolean|false|Send a notification to the customer after creation|
|body|body|object|true|none|
|» data|body|object|false|none|
|»» type|body|string|false|Type|
|»» attributes|body|object|false|Attributes|
|»»» paid_at|body|string(date)|false|Local payment date|
|»»» foreign_price|body|number(float)|false|Paid price in the same currency as the invoice currency|
|»»» memo|body|string|false|An optional note|
|»» relationships|body|object|false|Relationships|
|»»» invoice|body|object|false|none|
|»»»» data|body|object|false|none|
|»»»»» id|body|string|false|invoice ID|
|»»»»» type|body|string|false|none|
|»»»» links|body|object|false|none|
|»»»»» related|body|string|false|none|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "payment",
    "attributes": {
      "paid_at": "2020-06-09",
      "foreign_price": 0,
      "memo": "string"
    },
    "relationships": {
      "invoice": {
        "data": {
          "id": "string",
          "type": "invoice"
        },
        "links": {
          "related": "string"
        }
      }
    }
  }
}
```

<h3 id="post-payment-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|PaymentResponse|Inline|
|default|Default|Error|Inline|

<h3 id="post-payment-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Payment](#schemapayment)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» paid_at|string(date)|false|none|Local payment date|
|»»» foreign_price|number(float)|false|none|Paid price in the same currency as the invoice currency|
|»»» memo|string|false|none|An optional note|
|»» relationships|object|false|none|Relationships|
|»»» invoice|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|invoice ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## GET payment

<a id="opIdPayments_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations/string/payments/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations/string/payments/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations/string/payments/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string/payments/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations/string/payments/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string/payments/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations/string/payments/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string/payments/string"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations/{administration_id}/payments/{id}`

Returns the payment for the given ID

<h3 id="get-payment-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|administration_id|path|string|true|Administration ID|
|id|path|string|true|Resource ID|
|fields[payment]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[paid_at]|query|string|false|Filter on paid_at|
|filter[foreign_price]|query|string|false|Filter on foreign_price|
|filter[memo]|query|string|false|Filter on memo|
|filter[invoice]|query|string|false|Filter on invoice. Specify a comma separated list of IDs to filter on.|
|include|query|string|false|Includes list. Specify a comma separated list of resources to include.|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "payment",
    "attributes": {
      "paid_at": "2020-06-09",
      "foreign_price": 0,
      "memo": "string"
    },
    "relationships": {
      "invoice": {
        "data": {
          "id": "string",
          "type": "invoice"
        },
        "links": {
          "related": "string"
        }
      }
    }
  }
}
```

<h3 id="get-payment-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|PaymentResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-payment-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Payment](#schemapayment)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» paid_at|string(date)|false|none|Local payment date|
|»»» foreign_price|number(float)|false|none|Paid price in the same currency as the invoice currency|
|»»» memo|string|false|none|An optional note|
|»» relationships|object|false|none|Relationships|
|»»» invoice|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|invoice ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-reservations">Reservations</h1>

## GET reservations

<a id="opIdReservations_Index"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations/string/reservations \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations/string/reservations HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations/string/reservations");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string/reservations")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations/string/reservations", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string/reservations",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations/string/reservations")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string/reservations"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations/{administration_id}/reservations`

Returns all reservations of the administration

<h3 id="get-reservations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|administration_id|path|string|true|Administration ID|
|page[number]|query|string|false|Page number|
|page[size]|query|string|false|Page size|
|sort|query|string|false|Sort. Specify a comma separated list of attributes to sort on. Prefix attribute with a \- to sort in descending order|
|fields[reservation]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[booking_nr]|query|string|false|Filter on booking_nr|
|filter[last_name]|query|string|false|Filter on last_name|
|filter[start_date]|query|string|false|Filter on start_date|
|filter[end_date]|query|string|false|Filter on end_date|
|filter[state]|query|string|false|Filter on state|
|filter[rentable]|query|string|false|Filter on rentable|
|filter[created_at]|query|string|false|Filter on created_at|
|filter[updated_at]|query|string|false|Filter on updated_at|
|filter[administration]|query|string|false|Filter on administration. Specify a comma separated list of IDs to filter on.|
|filter[order]|query|string|false|Filter on order. Specify a comma separated list of IDs to filter on.|
|include|query|string|false|Includes list. Specify a comma separated list of resources to include.|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": [
    {
      "id": "1",
      "type": "reservation",
      "attributes": {
        "booking_nr": "string",
        "last_name": "string",
        "start_date": "string",
        "end_date": "string",
        "state": "string",
        "rentable": "string",
        "created_at": "2020-06-09T07:58:26Z",
        "updated_at": "2020-06-09T07:58:26Z"
      },
      "links": {
        "self": "string"
      },
      "relationships": {
        "administration": {
          "data": {
            "id": "string",
            "type": "administration"
          },
          "links": {
            "related": "string"
          }
        },
        "order": {
          "data": {
            "id": "string",
            "type": "order"
          },
          "links": {
            "related": "string"
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "total_records": 0,
      "page": 0,
      "size": 0
    }
  }
}
```

<h3 id="get-reservations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ReservationCollectionResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-reservations-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[[Reservation](#schemareservation)]|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» booking_nr|string|false|none|none|
|»»» last_name|string|false|none|none|
|»»» start_date|string|false|none|none|
|»»» end_date|string|false|none|none|
|»»» state|string|false|none|none|
|»»» rentable|string|false|none|none|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|
|»» relationships|object|false|none|Relationships|
|»»» administration|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|administration ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|
|»»» order|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|order ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|
|» meta|object|false|none|none|
|»» pagination|object|false|none|none|
|»»» total_records|integer|false|none|none|
|»»» page|integer|false|none|none|
|»»» size|integer|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## GET reservation

<a id="opIdReservations_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations/string/reservations/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/administrations/string/reservations/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/administrations/string/reservations/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/administrations/string/reservations/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/administrations/string/reservations/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/administrations/string/reservations/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/administrations/string/reservations/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/administrations/string/reservations/string"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/administrations/{administration_id}/reservations/{id}`

Returns a reservation

<h3 id="get-reservation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|administration_id|path|string|true|Administration ID|
|id|path|string|true|Resource ID|
|fields[reservation]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[booking_nr]|query|string|false|Filter on booking_nr|
|filter[last_name]|query|string|false|Filter on last_name|
|filter[start_date]|query|string|false|Filter on start_date|
|filter[end_date]|query|string|false|Filter on end_date|
|filter[state]|query|string|false|Filter on state|
|filter[rentable]|query|string|false|Filter on rentable|
|filter[created_at]|query|string|false|Filter on created_at|
|filter[updated_at]|query|string|false|Filter on updated_at|
|filter[administration]|query|string|false|Filter on administration. Specify a comma separated list of IDs to filter on.|
|filter[order]|query|string|false|Filter on order. Specify a comma separated list of IDs to filter on.|
|include|query|string|false|Includes list. Specify a comma separated list of resources to include.|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "reservation",
    "attributes": {
      "booking_nr": "string",
      "last_name": "string",
      "start_date": "string",
      "end_date": "string",
      "state": "string",
      "rentable": "string",
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string"
    },
    "relationships": {
      "administration": {
        "data": {
          "id": "string",
          "type": "administration"
        },
        "links": {
          "related": "string"
        }
      },
      "order": {
        "data": {
          "id": "string",
          "type": "order"
        },
        "links": {
          "related": "string"
        }
      }
    }
  }
}
```

<h3 id="get-reservation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ReservationResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-reservation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Reservation](#schemareservation)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» booking_nr|string|false|none|none|
|»»» last_name|string|false|none|none|
|»»» start_date|string|false|none|none|
|»»» end_date|string|false|none|none|
|»»» state|string|false|none|none|
|»»» rentable|string|false|none|none|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|
|»» relationships|object|false|none|Relationships|
|»»» administration|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|administration ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|
|»»» order|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|order ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-subscriptions">Subscriptions</h1>

## GET subscription

<a id="opIdSubscriptions_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/subscription \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/subscription HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/subscription");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/subscription")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/subscription", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/subscription",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/subscription")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/subscription"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/subscription`

Returns the subscription of the current organization

<h3 id="get-subscription-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|fields[subscription]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[authorized]|query|string|false|Filter on authorized|
|filter[user_locale]|query|string|false|Filter on user_locale|
|filter[created_at]|query|string|false|Filter on created_at|
|filter[updated_at]|query|string|false|Filter on updated_at|
|filter[organization]|query|string|false|Filter on organization. Specify a comma separated list of IDs to filter on.|
|filter[administration_subscriptions]|query|string|false|Filter on administration_subscriptions. Specify a comma separated list of IDs to filter on.|
|include|query|string|false|Includes list. Specify a comma separated list of resources to include.|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "subscription",
    "attributes": {
      "authorized": "string",
      "user_locale": "string",
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string",
      "url": "string"
    },
    "relationships": {
      "organization": {
        "data": {
          "id": "string",
          "type": "organization"
        },
        "links": {
          "related": "string"
        }
      },
      "administration_subscriptions": {
        "data": [
          {
            "id": "string",
            "type": "administration_subscription"
          }
        ]
      }
    }
  }
}
```

<h3 id="get-subscription-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|SubscriptionResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-subscription-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[Subscription](#schemasubscription)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» authorized|string|false|none|Returns whether a user has authorized this subscription|
|»»» user_locale|string|false|none|The locale of the user that created this subscription|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|
|»»» url|string|false|none|Link to url|
|»» relationships|object|false|none|Relationships|
|»»» organization|object|false|none|none|
|»»»» data|object|false|none|none|
|»»»»» id|string|false|none|organization ID|
|»»»»» type|string|false|none|none|
|»»»» links|object|false|none|none|
|»»»»» related|string|false|none|none|
|»»» administration_subscriptions|object|false|none|none|
|»»»» data|[object]|false|none|none|
|»»»»» id|string|false|none|administration_subscriptions ID|
|»»»»» type|string|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

<h1 id="booking-experts-contentapi-webhook-endpoints">Webhook Endpoints</h1>

## GET webhook endpoints

<a id="opIdWebhook Endpoints_Index"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/webhook_endpoints \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/webhook_endpoints HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/webhook_endpoints");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/webhook_endpoints")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/webhook_endpoints", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/webhook_endpoints",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/webhook_endpoints")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/webhook_endpoints"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/webhook_endpoints`

Returns the webhook endpoints you have registered for the current application

<h3 id="get-webhook-endpoints-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page[number]|query|string|false|Page number|
|page[size]|query|string|false|Page size|
|sort|query|string|false|Sort. Specify a comma separated list of attributes to sort on. Prefix attribute with a \- to sort in descending order|
|fields[webhook_endpoint]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[target_url]|query|string|false|Filter on target_url|
|filter[confirm_strategy]|query|string|false|Filter on confirm_strategy|
|filter[events]|query|string|false|Filter on events|
|filter[created_at]|query|string|false|Filter on created_at|
|filter[updated_at]|query|string|false|Filter on updated_at|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": [
    {
      "id": "1",
      "type": "webhook_endpoint",
      "attributes": {
        "target_url": "https://myapp.lvh.me:3000/callback",
        "confirm_strategy": "wait_for_success",
        "events": [
          "reservation|created",
          "reservation|updated",
          "reservation|deleted"
        ],
        "created_at": "2020-06-09T07:58:26Z",
        "updated_at": "2020-06-09T07:58:26Z"
      },
      "links": {
        "self": "string"
      }
    }
  ],
  "meta": {
    "pagination": {
      "total_records": 0,
      "page": 0,
      "size": 0
    }
  }
}
```

<h3 id="get-webhook-endpoints-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|WebhookEndpointCollectionResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-webhook-endpoints-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[[WebhookEndpoint](#schemawebhookendpoint)]|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» target_url|string|false|none|none|
|»»» confirm_strategy|string|false|none|One of: wait_for_success, fire_and_forget|
|»»» events|[string]|false|none|One or more of:<br><br>* accommodation_subtype|created<br>* accommodation_subtype|deleted<br>* accommodation_subtype|updated<br>* administration|created<br>* administration|deleted<br>* administration|updated<br>* agenda_period|created<br>* agenda_period|deleted<br>* agenda_period|updated<br>* area_type|created<br>* area_type|deleted<br>* area_type|updated<br>* arrival_checkout_date|created<br>* arrival_checkout_date|deleted<br>* arrival_checkout_date|updated<br>* category_group|created<br>* category_group|deleted<br>* category_group|updated<br>* category|created<br>* category|deleted<br>* category|reindexed<br>* category|updated<br>* channel|created<br>* channel|deleted<br>* channel|updated<br>* city|created<br>* city|deleted<br>* city|updated<br>* cost|created<br>* cost|deleted<br>* cost|updated<br>* currency_conversion|created<br>* currency_conversion|deleted<br>* currency_conversion|updated<br>* discount_action|created<br>* discount_action|deleted<br>* discount_action|updated<br>* extra|created<br>* extra|deleted<br>* extra|updated<br>* invoice|created<br>* invoice|deleted<br>* invoice|updated<br>* organization|created<br>* organization|deleted<br>* organization|updated<br>* package_entry|created<br>* package_entry|deleted<br>* package_entry|updated<br>* package|created<br>* package|deleted<br>* package|updated<br>* payment_method|created<br>* payment_method|deleted<br>* payment_method|updated<br>* payment|created<br>* payment|deleted<br>* payment|updated<br>* period|created<br>* period|deleted<br>* period|updated<br>* region|created<br>* region|deleted<br>* region|updated<br>* rentable_identity|created<br>* rentable_identity|deleted<br>* rentable_identity|updated<br>* rentable|created<br>* rentable|deleted<br>* rentable|updated<br>* reservation|cancelled<br>* reservation|confirmed<br>* reservation|created<br>* reservation|deleted<br>* reservation|updated<br>* review|created<br>* review|deleted<br>* review|updated<br>* room_type|created<br>* room_type|deleted<br>* room_type|updated<br>* room|created<br>* room|deleted<br>* room|updated<br>* subscription|created<br>* subscription|deleted<br>* subscription|updated<br>* terms|created<br>* terms|deleted<br>* terms|updated|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|
|» meta|object|false|none|none|
|»» pagination|object|false|none|none|
|»»» total_records|integer|false|none|none|
|»»» page|integer|false|none|none|
|»»» size|integer|false|none|none|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## POST webhook endpoint

<a id="opIdWebhook Endpoints_Create"></a>

> Code samples

```shell
curl --request POST \
  --url https://api.bookingexperts.nl/v3/webhook_endpoints \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'content-type: application/vnd.api+json' \
  --header 'x-api-key: API_KEY' \
  --data '{"data":{"type":"webhook_endpoint","attributes":{"target_url":"https://myapp.lvh.me:3000/callback","confirm_strategy":"wait_for_success","events":["reservation|created","reservation|updated","reservation|deleted"]}}}'
```

```http
POST /v3/webhook_endpoints HTTP/1.1
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl
Content-Length: 216

{"data":{"type":"webhook_endpoint","attributes":{"target_url":"https://myapp.lvh.me:3000/callback","confirm_strategy":"wait_for_success","events":["reservation|created","reservation|updated","reservation|deleted"]}}}
```

```javascript
var data = "{\"data\":{\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}";

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "https://api.bookingexperts.nl/v3/webhook_endpoints");
xhr.setRequestHeader("content-type", "application/vnd.api+json");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/webhook_endpoints")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Post.new(url)
request["content-type"] = 'application/vnd.api+json'
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'
request.body = "{\"data\":{\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}"

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

payload = "{\"data\":{\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}"

headers = {
    'content-type': "application/vnd.api+json",
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("POST", "/v3/webhook_endpoints", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/webhook_endpoints",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => "{\"data\":{\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "content-type: application/vnd.api+json",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.post("https://api.bookingexperts.nl/v3/webhook_endpoints")
  .header("content-type", "application/vnd.api+json")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .body("{\"data\":{\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}")
  .asString();
```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/webhook_endpoints"

	payload := strings.NewReader("{\"data\":{\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("content-type", "application/vnd.api+json")
	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`POST /v3/webhook_endpoints`

Create a new webhook endpoint. When webhooks are called, the following **JSON** data will be sent using a **POST** request:

```json
  {
    # Event, for example: reservation|created
    "event": "event_name",
    # Optional event metadata. In case of updates, this will contain a changes hash, for example: { "changes": { "booking_nr": ['1001', '1002'] } }
    "event_metadata": {},
    # The context of the passed record. One of the following: administration, organization, global.
    "context": "administration",
    # The context ID, if any. Will contain the ID of the administration or organization if applicable.
    "context_id": "id",
    # The record on which the event applies. Conforms to the documented schema.
    "record": { "data": { "id": "1", "type": "reservation" } },
    # The subscription ID of the application subscription for which this event has been sent
    "subscription_id": "id"
  }
```

> Body parameter

```json
{
  "data": {
    "type": "webhook_endpoint",
    "attributes": {
      "target_url": "https://myapp.lvh.me:3000/callback",
      "confirm_strategy": "wait_for_success",
      "events": [
        "reservation|created",
        "reservation|updated",
        "reservation|deleted"
      ]
    }
  }
}
```

<h3 id="post-webhook-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|
|body|body|object|true|none|
|» data|body|object|false|none|
|»» type|body|string|false|Type|
|»» attributes|body|object|false|Attributes|
|»»» target_url|body|string|false|none|
|»»» confirm_strategy|body|string|false|One of: wait_for_success, fire_and_forget|
|»»» events|body|[string]|false|One or more of:|

#### Detailed descriptions

**»»» events**: One or more of:

* accommodation_subtype|created
* accommodation_subtype|deleted
* accommodation_subtype|updated
* administration|created
* administration|deleted
* administration|updated
* agenda_period|created
* agenda_period|deleted
* agenda_period|updated
* area_type|created
* area_type|deleted
* area_type|updated
* arrival_checkout_date|created
* arrival_checkout_date|deleted
* arrival_checkout_date|updated
* category_group|created
* category_group|deleted
* category_group|updated
* category|created
* category|deleted
* category|reindexed
* category|updated
* channel|created
* channel|deleted
* channel|updated
* city|created
* city|deleted
* city|updated
* cost|created
* cost|deleted
* cost|updated
* currency_conversion|created
* currency_conversion|deleted
* currency_conversion|updated
* discount_action|created
* discount_action|deleted
* discount_action|updated
* extra|created
* extra|deleted
* extra|updated
* invoice|created
* invoice|deleted
* invoice|updated
* organization|created
* organization|deleted
* organization|updated
* package_entry|created
* package_entry|deleted
* package_entry|updated
* package|created
* package|deleted
* package|updated
* payment_method|created
* payment_method|deleted
* payment_method|updated
* payment|created
* payment|deleted
* payment|updated
* period|created
* period|deleted
* period|updated
* region|created
* region|deleted
* region|updated
* rentable_identity|created
* rentable_identity|deleted
* rentable_identity|updated
* rentable|created
* rentable|deleted
* rentable|updated
* reservation|cancelled
* reservation|confirmed
* reservation|created
* reservation|deleted
* reservation|updated
* review|created
* review|deleted
* review|updated
* room_type|created
* room_type|deleted
* room_type|updated
* room|created
* room|deleted
* room|updated
* subscription|created
* subscription|deleted
* subscription|updated
* terms|created
* terms|deleted
* terms|updated

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "webhook_endpoint",
    "attributes": {
      "target_url": "https://myapp.lvh.me:3000/callback",
      "confirm_strategy": "wait_for_success",
      "events": [
        "reservation|created",
        "reservation|updated",
        "reservation|deleted"
      ],
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="post-webhook-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|WebhookEndpointResponse|Inline|
|default|Default|Error|Inline|

<h3 id="post-webhook-endpoint-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[WebhookEndpoint](#schemawebhookendpoint)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» target_url|string|false|none|none|
|»»» confirm_strategy|string|false|none|One of: wait_for_success, fire_and_forget|
|»»» events|[string]|false|none|One or more of:<br><br>* accommodation_subtype|created<br>* accommodation_subtype|deleted<br>* accommodation_subtype|updated<br>* administration|created<br>* administration|deleted<br>* administration|updated<br>* agenda_period|created<br>* agenda_period|deleted<br>* agenda_period|updated<br>* area_type|created<br>* area_type|deleted<br>* area_type|updated<br>* arrival_checkout_date|created<br>* arrival_checkout_date|deleted<br>* arrival_checkout_date|updated<br>* category_group|created<br>* category_group|deleted<br>* category_group|updated<br>* category|created<br>* category|deleted<br>* category|reindexed<br>* category|updated<br>* channel|created<br>* channel|deleted<br>* channel|updated<br>* city|created<br>* city|deleted<br>* city|updated<br>* cost|created<br>* cost|deleted<br>* cost|updated<br>* currency_conversion|created<br>* currency_conversion|deleted<br>* currency_conversion|updated<br>* discount_action|created<br>* discount_action|deleted<br>* discount_action|updated<br>* extra|created<br>* extra|deleted<br>* extra|updated<br>* invoice|created<br>* invoice|deleted<br>* invoice|updated<br>* organization|created<br>* organization|deleted<br>* organization|updated<br>* package_entry|created<br>* package_entry|deleted<br>* package_entry|updated<br>* package|created<br>* package|deleted<br>* package|updated<br>* payment_method|created<br>* payment_method|deleted<br>* payment_method|updated<br>* payment|created<br>* payment|deleted<br>* payment|updated<br>* period|created<br>* period|deleted<br>* period|updated<br>* region|created<br>* region|deleted<br>* region|updated<br>* rentable_identity|created<br>* rentable_identity|deleted<br>* rentable_identity|updated<br>* rentable|created<br>* rentable|deleted<br>* rentable|updated<br>* reservation|cancelled<br>* reservation|confirmed<br>* reservation|created<br>* reservation|deleted<br>* reservation|updated<br>* review|created<br>* review|deleted<br>* review|updated<br>* room_type|created<br>* room_type|deleted<br>* room_type|updated<br>* room|created<br>* room|deleted<br>* room|updated<br>* subscription|created<br>* subscription|deleted<br>* subscription|updated<br>* terms|created<br>* terms|deleted<br>* terms|updated|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## GET webhook endpoint

<a id="opIdWebhook Endpoints_Show"></a>

> Code samples

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/webhook_endpoints/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
GET /v3/webhook_endpoints/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("GET", "https://api.bookingexperts.nl/v3/webhook_endpoints/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/webhook_endpoints/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Get.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("GET", "/v3/webhook_endpoints/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/webhook_endpoints/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.get("https://api.bookingexperts.nl/v3/webhook_endpoints/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/webhook_endpoints/string"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`GET /v3/webhook_endpoints/{id}`

Returns the webhook endpoint for the given ID

<h3 id="get-webhook-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Resource ID|
|fields[webhook_endpoint]|query|string|false|Fieldset. Specify a comma separated list of attributes to return|
|filter[target_url]|query|string|false|Filter on target_url|
|filter[confirm_strategy]|query|string|false|Filter on confirm_strategy|
|filter[events]|query|string|false|Filter on events|
|filter[created_at]|query|string|false|Filter on created_at|
|filter[updated_at]|query|string|false|Filter on updated_at|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "webhook_endpoint",
    "attributes": {
      "target_url": "https://myapp.lvh.me:3000/callback",
      "confirm_strategy": "wait_for_success",
      "events": [
        "reservation|created",
        "reservation|updated",
        "reservation|deleted"
      ],
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="get-webhook-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|WebhookEndpointResponse|Inline|
|default|Default|Error|Inline|

<h3 id="get-webhook-endpoint-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[WebhookEndpoint](#schemawebhookendpoint)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» target_url|string|false|none|none|
|»»» confirm_strategy|string|false|none|One of: wait_for_success, fire_and_forget|
|»»» events|[string]|false|none|One or more of:<br><br>* accommodation_subtype|created<br>* accommodation_subtype|deleted<br>* accommodation_subtype|updated<br>* administration|created<br>* administration|deleted<br>* administration|updated<br>* agenda_period|created<br>* agenda_period|deleted<br>* agenda_period|updated<br>* area_type|created<br>* area_type|deleted<br>* area_type|updated<br>* arrival_checkout_date|created<br>* arrival_checkout_date|deleted<br>* arrival_checkout_date|updated<br>* category_group|created<br>* category_group|deleted<br>* category_group|updated<br>* category|created<br>* category|deleted<br>* category|reindexed<br>* category|updated<br>* channel|created<br>* channel|deleted<br>* channel|updated<br>* city|created<br>* city|deleted<br>* city|updated<br>* cost|created<br>* cost|deleted<br>* cost|updated<br>* currency_conversion|created<br>* currency_conversion|deleted<br>* currency_conversion|updated<br>* discount_action|created<br>* discount_action|deleted<br>* discount_action|updated<br>* extra|created<br>* extra|deleted<br>* extra|updated<br>* invoice|created<br>* invoice|deleted<br>* invoice|updated<br>* organization|created<br>* organization|deleted<br>* organization|updated<br>* package_entry|created<br>* package_entry|deleted<br>* package_entry|updated<br>* package|created<br>* package|deleted<br>* package|updated<br>* payment_method|created<br>* payment_method|deleted<br>* payment_method|updated<br>* payment|created<br>* payment|deleted<br>* payment|updated<br>* period|created<br>* period|deleted<br>* period|updated<br>* region|created<br>* region|deleted<br>* region|updated<br>* rentable_identity|created<br>* rentable_identity|deleted<br>* rentable_identity|updated<br>* rentable|created<br>* rentable|deleted<br>* rentable|updated<br>* reservation|cancelled<br>* reservation|confirmed<br>* reservation|created<br>* reservation|deleted<br>* reservation|updated<br>* review|created<br>* review|deleted<br>* review|updated<br>* room_type|created<br>* room_type|deleted<br>* room_type|updated<br>* room|created<br>* room|deleted<br>* room|updated<br>* subscription|created<br>* subscription|deleted<br>* subscription|updated<br>* terms|created<br>* terms|deleted<br>* terms|updated|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## PATCH webhook endpoint

<a id="opIdWebhook Endpoints_Update"></a>

> Code samples

```shell
curl --request PATCH \
  --url https://api.bookingexperts.nl/v3/webhook_endpoints/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'content-type: application/vnd.api+json' \
  --header 'x-api-key: API_KEY' \
  --data '{"data":{"id":"1","type":"webhook_endpoint","attributes":{"target_url":"https://myapp.lvh.me:3000/callback","confirm_strategy":"wait_for_success","events":["reservation|created","reservation|updated","reservation|deleted"]}}}'
```

```http
PATCH /v3/webhook_endpoints/string HTTP/1.1
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl
Content-Length: 225

{"data":{"id":"1","type":"webhook_endpoint","attributes":{"target_url":"https://myapp.lvh.me:3000/callback","confirm_strategy":"wait_for_success","events":["reservation|created","reservation|updated","reservation|deleted"]}}}
```

```javascript
var data = "{\"data\":{\"id\":\"1\",\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}";

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("PATCH", "https://api.bookingexperts.nl/v3/webhook_endpoints/string");
xhr.setRequestHeader("content-type", "application/vnd.api+json");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/webhook_endpoints/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Patch.new(url)
request["content-type"] = 'application/vnd.api+json'
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'
request.body = "{\"data\":{\"id\":\"1\",\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}"

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

payload = "{\"data\":{\"id\":\"1\",\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}"

headers = {
    'content-type': "application/vnd.api+json",
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("PATCH", "/v3/webhook_endpoints/string", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/webhook_endpoints/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "PATCH",
  CURLOPT_POSTFIELDS => "{\"data\":{\"id\":\"1\",\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "content-type: application/vnd.api+json",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.patch("https://api.bookingexperts.nl/v3/webhook_endpoints/string")
  .header("content-type", "application/vnd.api+json")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .body("{\"data\":{\"id\":\"1\",\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}")
  .asString();
```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/webhook_endpoints/string"

	payload := strings.NewReader("{\"data\":{\"id\":\"1\",\"type\":\"webhook_endpoint\",\"attributes\":{\"target_url\":\"https://myapp.lvh.me:3000/callback\",\"confirm_strategy\":\"wait_for_success\",\"events\":[\"reservation|created\",\"reservation|updated\",\"reservation|deleted\"]}}}")

	req, _ := http.NewRequest("PATCH", url, payload)

	req.Header.Add("content-type", "application/vnd.api+json")
	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`PATCH /v3/webhook_endpoints/{id}`

Update a webhook endpoint

> Body parameter

```json
{
  "data": {
    "id": "1",
    "type": "webhook_endpoint",
    "attributes": {
      "target_url": "https://myapp.lvh.me:3000/callback",
      "confirm_strategy": "wait_for_success",
      "events": [
        "reservation|created",
        "reservation|updated",
        "reservation|deleted"
      ]
    }
  }
}
```

<h3 id="patch-webhook-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Resource ID|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|
|body|body|object|true|none|
|» data|body|object|false|none|
|»» id|body|string|false|ID|
|»» type|body|string|false|Type|
|»» attributes|body|object|false|Attributes|
|»»» target_url|body|string|false|none|
|»»» confirm_strategy|body|string|false|One of: wait_for_success, fire_and_forget|
|»»» events|body|[string]|false|One or more of:|

#### Detailed descriptions

**»»» events**: One or more of:

* accommodation_subtype|created
* accommodation_subtype|deleted
* accommodation_subtype|updated
* administration|created
* administration|deleted
* administration|updated
* agenda_period|created
* agenda_period|deleted
* agenda_period|updated
* area_type|created
* area_type|deleted
* area_type|updated
* arrival_checkout_date|created
* arrival_checkout_date|deleted
* arrival_checkout_date|updated
* category_group|created
* category_group|deleted
* category_group|updated
* category|created
* category|deleted
* category|reindexed
* category|updated
* channel|created
* channel|deleted
* channel|updated
* city|created
* city|deleted
* city|updated
* cost|created
* cost|deleted
* cost|updated
* currency_conversion|created
* currency_conversion|deleted
* currency_conversion|updated
* discount_action|created
* discount_action|deleted
* discount_action|updated
* extra|created
* extra|deleted
* extra|updated
* invoice|created
* invoice|deleted
* invoice|updated
* organization|created
* organization|deleted
* organization|updated
* package_entry|created
* package_entry|deleted
* package_entry|updated
* package|created
* package|deleted
* package|updated
* payment_method|created
* payment_method|deleted
* payment_method|updated
* payment|created
* payment|deleted
* payment|updated
* period|created
* period|deleted
* period|updated
* region|created
* region|deleted
* region|updated
* rentable_identity|created
* rentable_identity|deleted
* rentable_identity|updated
* rentable|created
* rentable|deleted
* rentable|updated
* reservation|cancelled
* reservation|confirmed
* reservation|created
* reservation|deleted
* reservation|updated
* review|created
* review|deleted
* review|updated
* room_type|created
* room_type|deleted
* room_type|updated
* room|created
* room|deleted
* room|updated
* subscription|created
* subscription|deleted
* subscription|updated
* terms|created
* terms|deleted
* terms|updated

> Example responses

> 200 Response

```json
{
  "data": {
    "id": "1",
    "type": "webhook_endpoint",
    "attributes": {
      "target_url": "https://myapp.lvh.me:3000/callback",
      "confirm_strategy": "wait_for_success",
      "events": [
        "reservation|created",
        "reservation|updated",
        "reservation|deleted"
      ],
      "created_at": "2020-06-09T07:58:26Z",
      "updated_at": "2020-06-09T07:58:26Z"
    },
    "links": {
      "self": "string"
    }
  }
}
```

<h3 id="patch-webhook-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|WebhookEndpointResponse|Inline|
|default|Default|Error|Inline|

<h3 id="patch-webhook-endpoint-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» data|[WebhookEndpoint](#schemawebhookendpoint)|false|none|none|
|»» id|string|false|none|ID|
|»» type|string|false|none|Type|
|»» attributes|object|false|none|Attributes|
|»»» target_url|string|false|none|none|
|»»» confirm_strategy|string|false|none|One of: wait_for_success, fire_and_forget|
|»»» events|[string]|false|none|One or more of:<br><br>* accommodation_subtype|created<br>* accommodation_subtype|deleted<br>* accommodation_subtype|updated<br>* administration|created<br>* administration|deleted<br>* administration|updated<br>* agenda_period|created<br>* agenda_period|deleted<br>* agenda_period|updated<br>* area_type|created<br>* area_type|deleted<br>* area_type|updated<br>* arrival_checkout_date|created<br>* arrival_checkout_date|deleted<br>* arrival_checkout_date|updated<br>* category_group|created<br>* category_group|deleted<br>* category_group|updated<br>* category|created<br>* category|deleted<br>* category|reindexed<br>* category|updated<br>* channel|created<br>* channel|deleted<br>* channel|updated<br>* city|created<br>* city|deleted<br>* city|updated<br>* cost|created<br>* cost|deleted<br>* cost|updated<br>* currency_conversion|created<br>* currency_conversion|deleted<br>* currency_conversion|updated<br>* discount_action|created<br>* discount_action|deleted<br>* discount_action|updated<br>* extra|created<br>* extra|deleted<br>* extra|updated<br>* invoice|created<br>* invoice|deleted<br>* invoice|updated<br>* organization|created<br>* organization|deleted<br>* organization|updated<br>* package_entry|created<br>* package_entry|deleted<br>* package_entry|updated<br>* package|created<br>* package|deleted<br>* package|updated<br>* payment_method|created<br>* payment_method|deleted<br>* payment_method|updated<br>* payment|created<br>* payment|deleted<br>* payment|updated<br>* period|created<br>* period|deleted<br>* period|updated<br>* region|created<br>* region|deleted<br>* region|updated<br>* rentable_identity|created<br>* rentable_identity|deleted<br>* rentable_identity|updated<br>* rentable|created<br>* rentable|deleted<br>* rentable|updated<br>* reservation|cancelled<br>* reservation|confirmed<br>* reservation|created<br>* reservation|deleted<br>* reservation|updated<br>* review|created<br>* review|deleted<br>* review|updated<br>* room_type|created<br>* room_type|deleted<br>* room_type|updated<br>* room|created<br>* room|deleted<br>* room|updated<br>* subscription|created<br>* subscription|deleted<br>* subscription|updated<br>* terms|created<br>* terms|deleted<br>* terms|updated|
|»»» created_at|string(date-time)|false|none|none|
|»»» updated_at|string(date-time)|false|none|none|
|»» links|object|false|none|Links|
|»»» self|string|false|none|Link to self|

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

## DELETE webhook endpoint

<a id="opIdWebhook Endpoints_Destroy"></a>

> Code samples

```shell
curl --request DELETE \
  --url https://api.bookingexperts.nl/v3/webhook_endpoints/string \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

```http
DELETE /v3/webhook_endpoints/string HTTP/1.1
Accept: application/vnd.api+json
Accept-Language: en,nl
X-Api-Key: API_KEY
Host: api.bookingexperts.nl

```

```javascript
var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("DELETE", "https://api.bookingexperts.nl/v3/webhook_endpoints/string");
xhr.setRequestHeader("accept", "application/vnd.api+json");
xhr.setRequestHeader("accept-language", "en,nl");
xhr.setRequestHeader("x-api-key", "API_KEY");

xhr.send(data);
```

```ruby
require 'uri'
require 'net/http'
require 'openssl'

url = URI("https://api.bookingexperts.nl/v3/webhook_endpoints/string")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE

request = Net::HTTP::Delete.new(url)
request["accept"] = 'application/vnd.api+json'
request["accept-language"] = 'en,nl'
request["x-api-key"] = 'API_KEY'

response = http.request(request)
puts response.read_body
```

```python
import http.client

conn = http.client.HTTPSConnection("api.bookingexperts.nl")

headers = {
    'accept': "application/vnd.api+json",
    'accept-language': "en,nl",
    'x-api-key': "API_KEY"
    }

conn.request("DELETE", "/v3/webhook_endpoints/string", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.bookingexperts.nl/v3/webhook_endpoints/string",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "DELETE",
  CURLOPT_HTTPHEADER => array(
    "accept: application/vnd.api+json",
    "accept-language: en,nl",
    "x-api-key: API_KEY"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
```

```java
HttpResponse<String> response = Unirest.delete("https://api.bookingexperts.nl/v3/webhook_endpoints/string")
  .header("accept", "application/vnd.api+json")
  .header("accept-language", "en,nl")
  .header("x-api-key", "API_KEY")
  .asString();
```

```go
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "https://api.bookingexperts.nl/v3/webhook_endpoints/string"

	req, _ := http.NewRequest("DELETE", url, nil)

	req.Header.Add("accept", "application/vnd.api+json")
	req.Header.Add("accept-language", "en,nl")
	req.Header.Add("x-api-key", "API_KEY")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

`DELETE /v3/webhook_endpoints/{id}`

Delete a webhook endpoint

<h3 id="delete-webhook-endpoint-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Resource ID|
|Accept-Language|header|string|false|Supported languages. A comma separated list with one or more of the following locales: nl, en, de, fr, da, cs, es, tr, pt, it. Default: 'en'.|

> Example responses

> default Response

```json
{
  "errors": [
    {
      "status": "string",
      "code": "string",
      "title": "string",
      "detail": "string",
      "source": {
        "pointer": "string"
      }
    }
  ]
}
```

<h3 id="delete-webhook-endpoint-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Success|None|
|default|Default|Error|Inline|

<h3 id="delete-webhook-endpoint-responseschema">Response Schema</h3>

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» errors|[object]|false|none|none|
|»» status|string|false|none|HTTP response code|
|»» code|string|false|none|Internal error code|
|»» title|string|false|none|Error title|
|»» detail|string|false|none|Error details|
|»» source|object|false|none|none|
|»»» pointer|string|false|none|Pointer to error in resource|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
ApiKeyAuth, OAuth2
</aside>

# Schemas

<h2 id="tocS_AccommodationSubtype">AccommodationSubtype</h2>
<!-- backwards compatibility -->
<a id="schemaaccommodationsubtype"></a>
<a id="schema_AccommodationSubtype"></a>
<a id="tocSaccommodationsubtype"></a>
<a id="tocsaccommodationsubtype"></a>

```yaml
id: "1"
type: accommodation_subtype

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Administration">Administration</h2>
<!-- backwards compatibility -->
<a id="schemaadministration"></a>
<a id="schema_Administration"></a>
<a id="tocSadministration"></a>
<a id="tocsadministration"></a>

```yaml
id: "1"
type: administration
attributes:
  name: string
  phone: string
  website: string
  description:
    nl: string
    en: string
    de: string
    fr: string
    da: string
    cs: string
    es: string
    tr: string
    pt: string
    it: string
  surroundings_description:
    nl: string
    en: string
    de: string
    fr: string
    da: string
    cs: string
    es: string
    tr: string
    pt: string
    it: string
  available_locales:
    - string
  utc_offset: string
links:
  self: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» name|string|false|none|none|
|» phone|string|false|none|none|
|» website|string|false|none|none|
|» description|object|false|none|A description of the administration|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» surroundings_description|object|false|none|A description of the surroundings|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» available_locales|[string]|false|none|Enabled locales|
|» utc_offset|string|false|none|The UTC offset of the administration, for example: +01:00|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|

<h2 id="tocS_AdministrationSubscription">AdministrationSubscription</h2>
<!-- backwards compatibility -->
<a id="schemaadministrationsubscription"></a>
<a id="schema_AdministrationSubscription"></a>
<a id="tocSadministrationsubscription"></a>
<a id="tocsadministrationsubscription"></a>

```yaml
id: "1"
type: administration_subscription
relationships:
  administration:
    data:
      id: string
      type: administration
  channel:
    data:
      id: string
      type: channel

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|relationships|object|false|none|Relationships|
|» administration|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|administration ID|
|»»» type|string|false|none|none|
|» channel|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|channel ID|
|»»» type|string|false|none|none|

<h2 id="tocS_AgendaPeriod">AgendaPeriod</h2>
<!-- backwards compatibility -->
<a id="schemaagendaperiod"></a>
<a id="schema_AgendaPeriod"></a>
<a id="tocSagendaperiod"></a>
<a id="tocsagendaperiod"></a>

```yaml
id: "1"
type: agenda_period

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_ApplicationCommand">ApplicationCommand</h2>
<!-- backwards compatibility -->
<a id="schemaapplicationcommand"></a>
<a id="schema_ApplicationCommand"></a>
<a id="tocSapplicationcommand"></a>
<a id="tocsapplicationcommand"></a>

```yaml
id: "1"
type: application_command
attributes:
  identifier: create_cards
  name:
    en: Create gate cards
    nl: Toegangskaarten maken
  description:
    en: Create gate cards for this gate system
    nl: Toegangskaarten maken voor dit toegangssysteem
  context_model: reservation
  http_method: post
  target_url: https://myapp.lvh.me:3000/gate_cards
  enabled_script: reservation.dig(:data, :attributes, :state) == 'confirmed'
  created_at: 2020-06-09T07:58:26Z
  updated_at: 2020-06-09T07:58:26Z
links:
  self: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» identifier|string|false|none|none|
|» name|object|false|none|none|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» description|object|false|none|none|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» context_model|string|false|none|One of: invoice, reservation, subscription|
|» http_method|string|false|none|One of: get, post, put, patch, delete|
|» target_url|string|false|none|This URL will be called by us using the `http_method` specified|
|» enabled_script|string|false|none|When set, this script will be evaluated to determine whether an action should be available to a user.<br>The last line of your script will be the result of the script. When the result is truthy, the command will be enabled.<br>The following variables will be available to you:<br><br>* The JSON serialized context model as defined in `context_model`. For example: `reservation`. Conforms to the documented schema.<br>* `current_user` - The JSON serialized current user (when present). Conforms to the documented User schema.<br><br>The script language **MUST** be Ruby. The list of method calls you are allowed to make is limited to the following:<br><br>* Allowed methods on any object:<br>`==` `!=` `!` `present?` `blank?`<br>* Allowed methods on hash objects:<br>`[]` `dig`<br>* Allowed calculation methods:<br>`+` `-` `*` `/`|
|» created_at|string(date-time)|false|none|none|
|» updated_at|string(date-time)|false|none|none|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|

<h2 id="tocS_AreaType">AreaType</h2>
<!-- backwards compatibility -->
<a id="schemaareatype"></a>
<a id="schema_AreaType"></a>
<a id="tocSareatype"></a>
<a id="tocsareatype"></a>

```yaml
id: "1"
type: area_type

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_ArrivalCheckoutDate">ArrivalCheckoutDate</h2>
<!-- backwards compatibility -->
<a id="schemaarrivalcheckoutdate"></a>
<a id="schema_ArrivalCheckoutDate"></a>
<a id="tocSarrivalcheckoutdate"></a>
<a id="tocsarrivalcheckoutdate"></a>

```yaml
id: "1"
type: arrival_checkout_date

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Availability">Availability</h2>
<!-- backwards compatibility -->
<a id="schemaavailability"></a>
<a id="schema_Availability"></a>
<a id="tocSavailability"></a>
<a id="tocsavailability"></a>

```yaml
id: "1"
type: availabilities
attributes:
  start_date: string
  los: string
  checkin_time: string
  checkout_time: string
  price: string
  original_price: string
  rent_price: string
  original_rent_price: string
  stock: string
relationships:
  administration:
    data:
      id: string
      type: administrations
  category:
    data:
      id: string
      type: categories
  discount_campaign:
    data:
      id: string
      type: discount_campaigns
  missing_tags:
    data:
      - id: string
        type: tags
  rentables:
    data:
      - id: string
        type: rentables

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» start_date|string|false|none|none|
|» los|string|false|none|none|
|» checkin_time|string|false|none|none|
|» checkout_time|string|false|none|none|
|» price|string|false|none|none|
|» original_price|string|false|none|none|
|» rent_price|string|false|none|none|
|» original_rent_price|string|false|none|none|
|» stock|string|false|none|none|
|relationships|object|false|none|Relationships|
|» administration|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|administration ID|
|»»» type|string|false|none|none|
|» category|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|category ID|
|»»» type|string|false|none|none|
|» discount_campaign|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|discount_campaign ID|
|»»» type|string|false|none|none|
|» missing_tags|object|false|none|none|
|»» data|[object]|false|none|none|
|»»» id|string|false|none|missing_tags ID|
|»»» type|string|false|none|none|
|» rentables|object|false|none|none|
|»» data|[object]|false|none|none|
|»»» id|string|false|none|rentables ID|
|»»» type|string|false|none|none|

<h2 id="tocS_Base">Base</h2>
<!-- backwards compatibility -->
<a id="schemabase"></a>
<a id="schema_Base"></a>
<a id="tocSbase"></a>
<a id="tocsbase"></a>

```yaml
id: "1"
type: base

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_CategoryGroup">CategoryGroup</h2>
<!-- backwards compatibility -->
<a id="schemacategorygroup"></a>
<a id="schema_CategoryGroup"></a>
<a id="tocScategorygroup"></a>
<a id="tocscategorygroup"></a>

```yaml
id: "1"
type: category_group

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Category">Category</h2>
<!-- backwards compatibility -->
<a id="schemacategory"></a>
<a id="schema_Category"></a>
<a id="tocScategory"></a>
<a id="tocscategory"></a>

```yaml
id: "1"
type: category

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Channel">Channel</h2>
<!-- backwards compatibility -->
<a id="schemachannel"></a>
<a id="schema_Channel"></a>
<a id="tocSchannel"></a>
<a id="tocschannel"></a>

```yaml
id: "1"
type: channel

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_City">City</h2>
<!-- backwards compatibility -->
<a id="schemacity"></a>
<a id="schema_City"></a>
<a id="tocScity"></a>
<a id="tocscity"></a>

```yaml
id: "1"
type: city

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Cost">Cost</h2>
<!-- backwards compatibility -->
<a id="schemacost"></a>
<a id="schema_Cost"></a>
<a id="tocScost"></a>
<a id="tocscost"></a>

```yaml
id: "1"
type: cost
attributes:
  name:
    nl: string
    en: string
    de: string
    fr: string
    da: string
    cs: string
    es: string
    tr: string
    pt: string
    it: string
  description:
    nl: string
    en: string
    de: string
    fr: string
    da: string
    cs: string
    es: string
    tr: string
    pt: string
    it: string
  invoiced_as: string
  cost_type: string
  if_stay_overlaps: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» name|object|false|none|none|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» description|object|false|none|none|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» invoiced_as|string|false|none|none|
|» cost_type|string|false|none|none|
|» if_stay_overlaps|string|false|none|none|

<h2 id="tocS_Coupon">Coupon</h2>
<!-- backwards compatibility -->
<a id="schemacoupon"></a>
<a id="schema_Coupon"></a>
<a id="tocScoupon"></a>
<a id="tocscoupon"></a>

```yaml
id: "1"
type: coupon

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_CurrencyConversion">CurrencyConversion</h2>
<!-- backwards compatibility -->
<a id="schemacurrencyconversion"></a>
<a id="schema_CurrencyConversion"></a>
<a id="tocScurrencyconversion"></a>
<a id="tocscurrencyconversion"></a>

```yaml
id: "1"
type: currency_conversion

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_DiscountAction">DiscountAction</h2>
<!-- backwards compatibility -->
<a id="schemadiscountaction"></a>
<a id="schema_DiscountAction"></a>
<a id="tocSdiscountaction"></a>
<a id="tocsdiscountaction"></a>

```yaml
id: "1"
type: discount_action

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Extra">Extra</h2>
<!-- backwards compatibility -->
<a id="schemaextra"></a>
<a id="schema_Extra"></a>
<a id="tocSextra"></a>
<a id="tocsextra"></a>

```yaml
id: "1"
type: extra
attributes:
  name:
    nl: string
    en: string
    de: string
    fr: string
    da: string
    cs: string
    es: string
    tr: string
    pt: string
    it: string
  description:
    nl: string
    en: string
    de: string
    fr: string
    da: string
    cs: string
    es: string
    tr: string
    pt: string
    it: string
  memo_description:
    nl: string
    en: string
    de: string
    fr: string
    da: string
    cs: string
    es: string
    tr: string
    pt: string
    it: string
  invoiced_as: string
  selectable: string
  confirm_by_guest: string
  extra_type: string
  quantity_required: string
  memo_required: string
  maximum_quantity: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» name|object|false|none|none|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» description|object|false|none|none|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» memo_description|object|false|none|none|
|»» nl|string|false|none|none|
|»» en|string|false|none|none|
|»» de|string|false|none|none|
|»» fr|string|false|none|none|
|»» da|string|false|none|none|
|»» cs|string|false|none|none|
|»» es|string|false|none|none|
|»» tr|string|false|none|none|
|»» pt|string|false|none|none|
|»» it|string|false|none|none|
|» invoiced_as|string|false|none|none|
|» selectable|string|false|none|none|
|» confirm_by_guest|string|false|none|none|
|» extra_type|string|false|none|none|
|» quantity_required|string|false|none|none|
|» memo_required|string|false|none|none|
|» maximum_quantity|string|false|none|none|

<h2 id="tocS_Invoice">Invoice</h2>
<!-- backwards compatibility -->
<a id="schemainvoice"></a>
<a id="schema_Invoice"></a>
<a id="tocSinvoice"></a>
<a id="tocsinvoice"></a>

```yaml
id: "1"
type: invoice
attributes:
  invoice_nr: string
  foreign_total: 0
  foreign_total_open: 0
  foreign_currency: string
links:
  self: string
relationships:
  administration:
    data:
      id: string
      type: administration
    links:
      related: string
  reservation:
    data:
      id: string
      type: reservation
    links:
      related: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» invoice_nr|string|false|none|none|
|» foreign_total|number(float)|false|none|none|
|» foreign_total_open|number(float)|false|none|none|
|» foreign_currency|string|false|none|An ISO 4217 currency code|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|
|relationships|object|false|none|Relationships|
|» administration|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|administration ID|
|»»» type|string|false|none|none|
|»» links|object|false|none|none|
|»»» related|string|false|none|none|
|» reservation|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|reservation ID|
|»»» type|string|false|none|none|
|»» links|object|false|none|none|
|»»» related|string|false|none|none|

<h2 id="tocS_Order">Order</h2>
<!-- backwards compatibility -->
<a id="schemaorder"></a>
<a id="schema_Order"></a>
<a id="tocSorder"></a>
<a id="tocsorder"></a>

```yaml
id: "1"
type: order
attributes:
  reservation_days: string
  packaged_date_range: string
  primary_package_id: string
  extra_package_ids: string
  currency: string
  total: string
links:
  self: string
relationships:
  administration:
    data:
      id: string
      type: administration
  main_order_items:
    data:
      - id: string
        type: order_item
  extra_order_items:
    data:
      - id: string
        type: order_item

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» reservation_days|string|false|none|none|
|» packaged_date_range|string|false|none|none|
|» primary_package_id|string|false|none|none|
|» extra_package_ids|string|false|none|none|
|» currency|string|false|none|none|
|» total|string|false|none|none|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|
|relationships|object|false|none|Relationships|
|» administration|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|administration ID|
|»»» type|string|false|none|none|
|» main_order_items|object|false|none|none|
|»» data|[object]|false|none|none|
|»»» id|string|false|none|main_order_items ID|
|»»» type|string|false|none|none|
|» extra_order_items|object|false|none|none|
|»» data|[object]|false|none|none|
|»»» id|string|false|none|extra_order_items ID|
|»»» type|string|false|none|none|

<h2 id="tocS_Organization">Organization</h2>
<!-- backwards compatibility -->
<a id="schemaorganization"></a>
<a id="schema_Organization"></a>
<a id="tocSorganization"></a>
<a id="tocsorganization"></a>

```yaml
id: "1"
type: organization
attributes:
  name: string
  website: string
  country_code: string
  phone: string
  email: string
  weekend_behavior: string
  max_baby_age: 0
  max_child_age: 0
  max_adolescent_age: 0
  min_senior_age: 0
links:
  self: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» name|string|false|none|none|
|» website|string|false|none|none|
|» country_code|string|false|none|none|
|» phone|string|false|none|none|
|» email|string|false|none|none|
|» weekend_behavior|string|false|none|none|
|» max_baby_age|integer|false|none|none|
|» max_child_age|integer|false|none|none|
|» max_adolescent_age|integer|false|none|none|
|» min_senior_age|integer|false|none|none|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|

<h2 id="tocS_PackageEntry">PackageEntry</h2>
<!-- backwards compatibility -->
<a id="schemapackageentry"></a>
<a id="schema_PackageEntry"></a>
<a id="tocSpackageentry"></a>
<a id="tocspackageentry"></a>

```yaml
id: "1"
type: package_entry

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Package">Package</h2>
<!-- backwards compatibility -->
<a id="schemapackage"></a>
<a id="schema_Package"></a>
<a id="tocSpackage"></a>
<a id="tocspackage"></a>

```yaml
id: "1"
type: package

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_PaymentMethod">PaymentMethod</h2>
<!-- backwards compatibility -->
<a id="schemapaymentmethod"></a>
<a id="schema_PaymentMethod"></a>
<a id="tocSpaymentmethod"></a>
<a id="tocspaymentmethod"></a>

```yaml
id: "1"
type: payment_method

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Payment">Payment</h2>
<!-- backwards compatibility -->
<a id="schemapayment"></a>
<a id="schema_Payment"></a>
<a id="tocSpayment"></a>
<a id="tocspayment"></a>

```yaml
id: "1"
type: payment
attributes:
  paid_at: 2020-06-09
  foreign_price: 0
  memo: string
relationships:
  invoice:
    data:
      id: string
      type: invoice
    links:
      related: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» paid_at|string(date)|false|none|Local payment date|
|» foreign_price|number(float)|false|none|Paid price in the same currency as the invoice currency|
|» memo|string|false|none|An optional note|
|relationships|object|false|none|Relationships|
|» invoice|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|invoice ID|
|»»» type|string|false|none|none|
|»» links|object|false|none|none|
|»»» related|string|false|none|none|

<h2 id="tocS_Period">Period</h2>
<!-- backwards compatibility -->
<a id="schemaperiod"></a>
<a id="schema_Period"></a>
<a id="tocSperiod"></a>
<a id="tocsperiod"></a>

```yaml
id: "1"
type: period

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Region">Region</h2>
<!-- backwards compatibility -->
<a id="schemaregion"></a>
<a id="schema_Region"></a>
<a id="tocSregion"></a>
<a id="tocsregion"></a>

```yaml
id: "1"
type: region

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_RentableIdentity">RentableIdentity</h2>
<!-- backwards compatibility -->
<a id="schemarentableidentity"></a>
<a id="schema_RentableIdentity"></a>
<a id="tocSrentableidentity"></a>
<a id="tocsrentableidentity"></a>

```yaml
id: "1"
type: rentable_identity

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Rentable">Rentable</h2>
<!-- backwards compatibility -->
<a id="schemarentable"></a>
<a id="schema_Rentable"></a>
<a id="tocSrentable"></a>
<a id="tocsrentable"></a>

```yaml
id: "1"
type: rentable

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Reservation">Reservation</h2>
<!-- backwards compatibility -->
<a id="schemareservation"></a>
<a id="schema_Reservation"></a>
<a id="tocSreservation"></a>
<a id="tocsreservation"></a>

```yaml
id: "1"
type: reservation
attributes:
  booking_nr: string
  last_name: string
  start_date: string
  end_date: string
  state: string
  rentable: string
  created_at: 2020-06-09T07:58:26Z
  updated_at: 2020-06-09T07:58:26Z
links:
  self: string
relationships:
  administration:
    data:
      id: string
      type: administration
    links:
      related: string
  order:
    data:
      id: string
      type: order
    links:
      related: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» booking_nr|string|false|none|none|
|» last_name|string|false|none|none|
|» start_date|string|false|none|none|
|» end_date|string|false|none|none|
|» state|string|false|none|none|
|» rentable|string|false|none|none|
|» created_at|string(date-time)|false|none|none|
|» updated_at|string(date-time)|false|none|none|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|
|relationships|object|false|none|Relationships|
|» administration|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|administration ID|
|»»» type|string|false|none|none|
|»» links|object|false|none|none|
|»»» related|string|false|none|none|
|» order|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|order ID|
|»»» type|string|false|none|none|
|»» links|object|false|none|none|
|»»» related|string|false|none|none|

<h2 id="tocS_Review">Review</h2>
<!-- backwards compatibility -->
<a id="schemareview"></a>
<a id="schema_Review"></a>
<a id="tocSreview"></a>
<a id="tocsreview"></a>

```yaml
id: "1"
type: review

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Room">Room</h2>
<!-- backwards compatibility -->
<a id="schemaroom"></a>
<a id="schema_Room"></a>
<a id="tocSroom"></a>
<a id="tocsroom"></a>

```yaml
id: "1"
type: room

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_RoomType">RoomType</h2>
<!-- backwards compatibility -->
<a id="schemaroomtype"></a>
<a id="schema_RoomType"></a>
<a id="tocSroomtype"></a>
<a id="tocsroomtype"></a>

```yaml
id: "1"
type: room_type

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_Subscription">Subscription</h2>
<!-- backwards compatibility -->
<a id="schemasubscription"></a>
<a id="schema_Subscription"></a>
<a id="tocSsubscription"></a>
<a id="tocssubscription"></a>

```yaml
id: "1"
type: subscription
attributes:
  authorized: string
  user_locale: string
  created_at: 2020-06-09T07:58:26Z
  updated_at: 2020-06-09T07:58:26Z
links:
  self: string
  url: string
relationships:
  organization:
    data:
      id: string
      type: organization
    links:
      related: string
  administration_subscriptions:
    data:
      - id: string
        type: administration_subscription

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» authorized|string|false|none|Returns whether a user has authorized this subscription|
|» user_locale|string|false|none|The locale of the user that created this subscription|
|» created_at|string(date-time)|false|none|none|
|» updated_at|string(date-time)|false|none|none|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|
|» url|string|false|none|Link to url|
|relationships|object|false|none|Relationships|
|» organization|object|false|none|none|
|»» data|object|false|none|none|
|»»» id|string|false|none|organization ID|
|»»» type|string|false|none|none|
|»» links|object|false|none|none|
|»»» related|string|false|none|none|
|» administration_subscriptions|object|false|none|none|
|»» data|[object]|false|none|none|
|»»» id|string|false|none|administration_subscriptions ID|
|»»» type|string|false|none|none|

<h2 id="tocS_Terms">Terms</h2>
<!-- backwards compatibility -->
<a id="schematerms"></a>
<a id="schema_Terms"></a>
<a id="tocSterms"></a>
<a id="tocsterms"></a>

```yaml
id: "1"
type: terms

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|

<h2 id="tocS_User">User</h2>
<!-- backwards compatibility -->
<a id="schemauser"></a>
<a id="schema_User"></a>
<a id="tocSuser"></a>
<a id="tocsuser"></a>

```yaml
id: "1"
type: user
attributes:
  email: string
  name: string
  locale: string
  timezone: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» email|string|false|none|none|
|» name|string|false|none|none|
|» locale|string|false|none|none|
|» timezone|string|false|none|none|

<h2 id="tocS_WebhookEndpoint">WebhookEndpoint</h2>
<!-- backwards compatibility -->
<a id="schemawebhookendpoint"></a>
<a id="schema_WebhookEndpoint"></a>
<a id="tocSwebhookendpoint"></a>
<a id="tocswebhookendpoint"></a>

```yaml
id: "1"
type: webhook_endpoint
attributes:
  target_url: https://myapp.lvh.me:3000/callback
  confirm_strategy: wait_for_success
  events:
    - reservation|created
    - reservation|updated
    - reservation|deleted
  created_at: 2020-06-09T07:58:26Z
  updated_at: 2020-06-09T07:58:26Z
links:
  self: string

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|false|none|ID|
|type|string|false|none|Type|
|attributes|object|false|none|Attributes|
|» target_url|string|false|none|none|
|» confirm_strategy|string|false|none|One of: wait_for_success, fire_and_forget|
|» events|[string]|false|none|One or more of:<br><br>* accommodation_subtype|created<br>* accommodation_subtype|deleted<br>* accommodation_subtype|updated<br>* administration|created<br>* administration|deleted<br>* administration|updated<br>* agenda_period|created<br>* agenda_period|deleted<br>* agenda_period|updated<br>* area_type|created<br>* area_type|deleted<br>* area_type|updated<br>* arrival_checkout_date|created<br>* arrival_checkout_date|deleted<br>* arrival_checkout_date|updated<br>* category_group|created<br>* category_group|deleted<br>* category_group|updated<br>* category|created<br>* category|deleted<br>* category|reindexed<br>* category|updated<br>* channel|created<br>* channel|deleted<br>* channel|updated<br>* city|created<br>* city|deleted<br>* city|updated<br>* cost|created<br>* cost|deleted<br>* cost|updated<br>* currency_conversion|created<br>* currency_conversion|deleted<br>* currency_conversion|updated<br>* discount_action|created<br>* discount_action|deleted<br>* discount_action|updated<br>* extra|created<br>* extra|deleted<br>* extra|updated<br>* invoice|created<br>* invoice|deleted<br>* invoice|updated<br>* organization|created<br>* organization|deleted<br>* organization|updated<br>* package_entry|created<br>* package_entry|deleted<br>* package_entry|updated<br>* package|created<br>* package|deleted<br>* package|updated<br>* payment_method|created<br>* payment_method|deleted<br>* payment_method|updated<br>* payment|created<br>* payment|deleted<br>* payment|updated<br>* period|created<br>* period|deleted<br>* period|updated<br>* region|created<br>* region|deleted<br>* region|updated<br>* rentable_identity|created<br>* rentable_identity|deleted<br>* rentable_identity|updated<br>* rentable|created<br>* rentable|deleted<br>* rentable|updated<br>* reservation|cancelled<br>* reservation|confirmed<br>* reservation|created<br>* reservation|deleted<br>* reservation|updated<br>* review|created<br>* review|deleted<br>* review|updated<br>* room_type|created<br>* room_type|deleted<br>* room_type|updated<br>* room|created<br>* room|deleted<br>* room|updated<br>* subscription|created<br>* subscription|deleted<br>* subscription|updated<br>* terms|created<br>* terms|deleted<br>* terms|updated|
|» created_at|string(date-time)|false|none|none|
|» updated_at|string(date-time)|false|none|none|
|links|object|false|none|Links|
|» self|string|false|none|Link to self|

