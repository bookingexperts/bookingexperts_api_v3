# Overview

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
The specification is hosted here: `https://api.bookingexperts.nl/v3/oas3.json`

## Responses

```shell
curl --request GET \
  --url https://api.bookingexperts.nl/v3/administrations \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY'
```

> Might produce the following output

```json
{
  "errors": [
    {
      "status": 401,
      "code": "RESOURCE_NOT_FOUND",
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

## Throttling

Usage of the Booking Experts API is virtually unlimited. However, to prevent fraud and abuse, requests to the API are throttled.
By default you are allowed to call the API 500 times within a moving window of 15 minutes. Additionally, bursts of 100 calls per minute are allowed within this window.

While within the limit, each response contains a `X-RateLimit-Limit` and a `X-RateLimit-Remaining` header containing the set limit & the remaining allowance in the window.
If you exceed the limit, the API will respond with a 429 Too many requests response. This response contains a header Retry-After containing the time after which a new calls are allowed.

If your use case requires more lenient rate limits, please contact us at [connectivity@bookingexperts.nl](mailto:connectivity@bookingexperts.nl) to request a higher limit.

## Pagination

```json
{
  "links": {
    "self": "https://api.bookingexperts.nl/v3/administrations/1/reservations?page%5Bnumber%5D=2",
    "first": "https://api.bookingexperts.nl/v3/administrations/1/reservations?page%5Bnumber%5D=1",
    "last": "https://api.bookingexperts.nl/v3/administrations/1/reservations?page%5Bnumber%5D=14",
    "prev": "https://api.bookingexperts.nl/v3/administrations/1/reservations?page%5Bnumber%5D=1",
    "next": "https://api.bookingexperts.nl/v3/administrations/1/reservations?page%5Bnumber%5D=3"
  }
  "data": [...]
}
```

All collection responses include pagination. In the response body you will find a `links` node that contains links to `first`, `self`, `next`, `prev`, `last` pages.
Most responses have 30 records per page.

## Field sets

By default every request returns a quite complete set of fields (attributes and relationships). You can limit or expand this default set however. Per record type you can specify which fields to include. There are 2 ways of using this feature:

### Whitelist

```shell
curl --request GET \
  --url 'http://api.lvh.me:3000/v3/administrations?fields[administration]=name,description' \
  --header 'accept: application/vnd.api+json' \
  --header 'accept-language: en,nl' \
  --header 'x-api-key: API_KEY' | jsonpp
```

Will return only the name and description fields of every administration.

## Filters

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

## Get acccess

First of you need access to at least one Booking Experts organization.
Inside the administration you can register a new application.

By default this application is only accessible by the administrations of this organization.
Very handy if you want to make a on the fly integration. But when your app is ready for other organizations to use, you can sign-up for validation to the marketplace.

### Authentication

You can authenticate on by using OAuth2. For on the fly needs you can make use of a simple authentication token but this has limited access to only the organization and it's administrations to which is registered.

If you want others to make use of your app you will need to support OAuth2.
