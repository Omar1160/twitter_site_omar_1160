$src = 'C:\Users\omari\Documents\Twitter Site\twitter_site_omar_1160\images'
$dst = 'C:\Users\omari\Documents\Twitter Site\twitter_site_omar_1160\sales-site\public\testimonials'

New-Item -ItemType Directory -Path $dst -Force

Copy-Item "$src\Chuffsters testamonial.png" "$dst\chuffsters.png"
Copy-Item "$src\Dani Visser testamonial.png" "$dst\dani-visser.png"
Copy-Item "$src\Dom Jackson Testamonial.png" "$dst\dom-jackson.png"
Copy-Item "$src\effron testamonial.png" "$dst\efron.png"
Copy-Item "$src\Eman SV2 testamonial.png" "$dst\sv2.png"
Copy-Item "$src\Roy Van Den Berg Testamonial.png" "$dst\roy-van-den-berg.png"
Copy-Item "$src\Vojta Killinger Testamonial.png" "$dst\vojta-killinger.png"
Copy-Item "$src\Zackry McAllister Testamonial .png" "$dst\zackry-1.png"
Copy-Item "$src\Zackry McAllister Testamonial  2.png" "$dst\zackry-2.png"

Write-Host "Done!"
Get-ChildItem $dst | Select-Object Name
