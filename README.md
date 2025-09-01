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
    // Get one license row
    Row = Json.Document(
        Web.Contents("https://quanvio.github.io/licenses/data/licenses/POSIFLEX000000000000000001.json")
    ),

    // If Row[Active] is true, keep it as a table, else empty
    Result =
        if Record.HasFields(Row, "Active") and Row[Active] = true
        then Table.FromRecords({Row})
        else #table({"LicenseId","Company","Active","Link"}, {})
in
    Result
