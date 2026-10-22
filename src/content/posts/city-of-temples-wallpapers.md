---
title: "Kathmandu Valley Wallpapers: 1,898 Places of Worship"
description: "Free light and dark phone and desktop wallpapers of the 1,898 temples, shrines and stupas mapped in Kathmandu, Lalitpur and Bhaktapur, built from OpenStreetMap."
published: 2026-11-01
category: "Open data + maps"
readingTime: "3 min read"
summary: "Every temple, shrine and stupa mapped in OpenStreetMap inside Kathmandu, Lalitpur and Bhaktapur districts, as free phone and desktop wallpapers in a light and a dark version. 1,898 places, drawn as dots over hard-edged density steps."
keywords: ["Kathmandu Valley", "temples", "places of worship", "stupas", "shrines", "wallpaper", "OpenStreetMap", "Overpass API", "Nepal", "data visualization"]
hero: ../../assets/wallpapers/kathmandu-city-of-temples-desktop-preview.jpg
heroAlt: "Wallpaper of 1,898 places of worship mapped in Kathmandu Valley, shown as dots over colour steps of density"
heroCaption: "Kathmandu Valley. Each dot is one temple, shrine or stupa mapped in OpenStreetMap."
ogImage: assets/og-city-of-temples-wallpapers.jpg
ogImageAlt: "Kathmandu Valley wallpapers: 1,898 places of worship"
sourceUrl: https://www.openstreetmap.org/
sourceLabel: "Data: OpenStreetMap"
license: https://creativecommons.org/licenses/by/4.0/
credit: "Nishon Tandukar (nishon.com.np/city-of-temples-wallpapers). Map and place data © OpenStreetMap contributors, ODbL 1.0 (openstreetmap.org/copyright). Terrain: SRTM and GMTED2010 data courtesy of the U.S. Geological Survey, via AWS Terrain Tiles."
geo: { region: NP-BA, placename: "Kathmandu Valley, Nepal", lat: 27.7172, lon: 85.324 }
places:
  - { "@type": Place, name: Kathmandu Valley, sameAs: "https://en.wikipedia.org/wiki/Kathmandu_Valley", geo: { "@type": GeoCoordinates, latitude: 27.7172, longitude: 85.324 } }
  - { "@type": Place, name: Lalitpur, sameAs: "https://en.wikipedia.org/wiki/Lalitpur,_Nepal", geo: { "@type": GeoCoordinates, latitude: 27.6766, longitude: 85.3142 } }
  - { "@type": Place, name: Bhaktapur, sameAs: "https://en.wikipedia.org/wiki/Bhaktapur", geo: { "@type": GeoCoordinates, latitude: 27.671, longitude: 85.4298 } }
sources:
  - { name: OpenStreetMap, url: "https://www.openstreetmap.org/" }
  - { name: Overpass API, url: "https://overpass-api.de/" }
  - { name: AWS Terrain Tiles, url: "https://registry.opendata.aws/terrain-tiles/" }
downloads:
  - { file: kathmandu-city-of-temples-desktop, label: Kathmandu Valley places of worship wallpaper (desktop), width: 3840, height: 2160 }
  - { file: kathmandu-city-of-temples-phone, label: Kathmandu Valley places of worship wallpaper (phone), width: 1440, height: 3120 }
  - { file: kathmandu-city-of-temples-desktop-dark, label: Kathmandu Valley places of worship wallpaper (desktop, dark), width: 3840, height: 2160 }
  - { file: kathmandu-city-of-temples-phone-dark, label: Kathmandu Valley places of worship wallpaper (phone, dark), width: 1440, height: 3120 }
faq:
  - q: How many places of worship are there in Kathmandu Valley?
    a: "1,898 are mapped in OpenStreetMap inside the Kathmandu, Lalitpur and Bhaktapur district borders, as of October 2026. 1,116 are tagged Hindu and 282 Buddhist. The real number is higher, because OpenStreetMap only holds what someone has mapped."
  - q: What counts as a place of worship here?
    a: "Anything tagged as a place of worship, shrine, wayside shrine, temple or stupa. That includes small street shrines and stupas, and a few churches and mosques."
  - q: What do the colours mean?
    a: "Darker or warmer steps mean more places close together. The map is smoothed over about a kilometre and drawn in hard steps, so read it as where places cluster, not as a count for one street."
  - q: Can I use the wallpapers?
    a: "Yes. The wallpapers are licensed CC BY 4.0: use, share, print or adapt them, including commercially, as long as you give the credit listed under Use and credit and link to this page."
---
Every temple, shrine and stupa that is mapped in Kathmandu, Lalitpur and Bhaktapur, on one map, as wallpapers for your phone and your desktop, in a light and a dark version. Each dot is one place. The colour steps show where places cluster.

## How to read it

Each small dot is one place of worship. The coloured areas get darker in the light version, and warmer in the dark version, where more places sit close together. The densest part is the old core of Kathmandu, with Patan and Bhaktapur as separate patches to the south and east. The thin outline is the border of the three districts. The thick line is the Ring Road, and the long lines out of the valley are the Araniko Highway, the Tribhuvan Rajpath and the Pasang Lhamu Highway.

## Set it as your wallpaper

- **iPhone:** open the image in Photos, tap Share, then Use as Wallpaper.
- **Android:** open the image in your gallery, open the menu, then Set as wallpaper.
- **Windows:** right-click the image, then Set as desktop background.
- **macOS:** right-click the image in Finder, then Set Desktop Picture.

## Where the data comes from

- **Places:** [OpenStreetMap](https://www.openstreetmap.org/), downloaded through the [Overpass API](https://overpass-api.de/) in October 2026. I took everything tagged `amenity=place_of_worship`, `amenity=shrine`, `historic=wayside_shrine`, `building=temple`, `building=shrine` or `man_made=stupa` that lies inside the Kathmandu, Lalitpur and Bhaktapur district borders.
- **Border:** the outer edge of the three OpenStreetMap district boundaries. Edges shared by two districts are internal and are dropped.
- **Roads:** the four main roads are drawn from OpenStreetMap too, and the finer streets are faint lines under the colour.
- **Terrain:** the [AWS terrain tiles](https://registry.opendata.aws/terrain-tiles/) elevation dataset, shaded into the hills.

## How the colour steps were made

I counted places in a grid over the valley, smoothed the counts over about a kilometre, and cut the result into five hard steps with a thin contour between them. The steps are 3, 8, 18, 35 and 60 or more places per square kilometre on the close-up maps I use for the same data. On a whole-valley wallpaper the smoothing is wider and the result is brightened a little so that thin areas still reach the first step, so read the steps as a guide to where places cluster and not as an exact count per square kilometre.

## Limits

- OpenStreetMap only holds what someone has mapped. Well-known temples are there, and small neighbourhood shrines are patchy, so the count of 1,898 is a lower bound and some areas look emptier than they are.
- The data includes shrines and stupas as well as temples, and a few churches and mosques. 1,116 places are tagged Hindu and 282 Buddhist. The rest have no religion tagged.
- A place is a point. A large temple complex with many shrines can appear as one dot or as many, depending on how it was mapped.

## Use and credit

The wallpapers are open licensed under [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). You can use, share, print and adapt them, including commercially, as long as you give credit and link to this page.

The images contain data from two sources, and each has its own credit rule. Keep both when you share a wallpaper.

- **This wallpaper:** Nishon Tandukar, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with a link to this page. Say if you changed it.
- **Map and places:** © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0. Credit OpenStreetMap and make clear the data is under the ODbL. In print, write out the address openstreetmap.org/copyright.
- **Terrain:** SRTM and GMTED2010 elevation data courtesy of the U.S. Geological Survey, served as [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/).

Copy and paste credit:

```text
Nishon Tandukar (nishon.com.np/city-of-temples-wallpapers). Map and place data © OpenStreetMap contributors, ODbL 1.0 (openstreetmap.org/copyright). Terrain: SRTM and GMTED2010 data courtesy of the U.S. Geological Survey, via AWS Terrain Tiles.
```

The fonts in the images, Yatra One and Mukta, are under the SIL Open Font License, which asks for no credit on pictures.

I also made flight maps of five Dashain days over Kathmandu and Pokhara: see the [Dashain flights wallpapers](/dashain-flights-wallpapers). The temples are on Instagram as a video and a set of maps at different zoom levels, at [@life.of.nishon](https://www.instagram.com/life.of.nishon/).
