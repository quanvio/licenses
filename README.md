# licenses
Public license validation and redirect
Postman

GET single license:
https://quanvio.github.io/licenses/data/licenses/QUANVIO000000000000000001.json

GET all (then filter):
https://quanvio.github.io/licenses/data/licenses.json

GET per company:
https://quanvio.github.io/licenses/data/company/Posiflex.json

POWERBI
let
    // Try to fetch license JSON
    Source = try Json.Document(
        Web.Contents("https://quanvio.github.io/licenses/data/licenses/POSIFLEX000000000000000001.json")
    ) otherwise null,

    // Define schema (so table always exists)
    Schema = {"LicenseId","Company","Active","Link"},

    // Build result row
    Result =
        if Source <> null and Record.HasFields(Source, "Active") and Source[Active] = true then
            Table.FromRecords({Source}, Schema)
        else
            #table(Schema, {{null,null,null,null}})
in
    Result

