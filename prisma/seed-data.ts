export type SeedLocale = "vi" | "en";

export interface SeedGuideSection {
  title: Record<SeedLocale, string>;
  content: Record<SeedLocale, string>;
}

export interface SeedCheckpoint {
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  priceVnd?: number | null;
  priceKind?: "ticket" | "food";
  translations: Record<
    SeedLocale,
    {
      name: string;
      summary: string;
      address: string;
      openingHours: string;
      bestTimeToVisit: string;
    }
  >;
  guides: SeedGuideSection[];
  images: { url: string; alt: string }[];
}

const photo = (slug: string, index: number) =>
  `https://picsum.photos/seed/${slug}-${index}/900/700`;

export const seedCheckpoints: SeedCheckpoint[] = [
  {
    slug: "mui-nai",
    latitude: 10.38787364349251,
    longitude: 104.4460601373039,
    radiusMeters: 100,
    estimatedVisitMinutes: 45,
    priceVnd: null,
    priceKind: "ticket",
    translations: {
      vi: {
        name: "Mũi Nai",
        summary:
          "Bãi biển nổi tiếng nhất Hà Tiên với triền cát vàng nâu, làn nước trong xanh và đường quanh co trên đồi.",
        address: "Phường Phú Hải, TP. Hà Tiên, An Giang",
        openingHours: "Cả ngày",
        bestTimeToVisit: "Sáng sớm hoặc chiều hoàng hôn",
      },
      en: {
        name: "Mui Nai Beach",
        summary:
          "Ha Tien's best-known beach with golden-brown sand, clear water and a winding hillside road.",
        address: "Phu Hai ward, Ha Tien, An Giang",
        openingHours: "All day",
        bestTimeToVisit: "Early morning or sunset",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Mũi Nai nằm cách trung tâm Hà Tiên khoảng 3 km về phía đông nam, là bãi tắm nổi bật nhất của thành phố biển này. Triền cát thoải, nước trong và hàng quán ven bờ khiến nơi đây phù hợp cho cả gia đình.",
          en: "Mui Nai lies about 3 km southeast of central Ha Tien and is the town's best-known swimming beach. Gentle sand, clear water and beachfront stalls make it a great family stop.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: 'Tên gọi Mũi Nai xuất hiện trong mười bài thơ nổi tiếng "Hà Tiên thập vịnh" của Mạc Thiên Tích thế kỷ XVIII — nơi đây xưa là bến nước gắn với đời sống cư dân ven biển.',
          en: "Mui Nai appears in the famous 18th-century poem cycle 'Ten Verses on Ha Tien' by Mac Thien Tich — long a landmark tied to the daily life of coastal communities.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Chiều muộn, người dân và du khách tụ về Mũi Nai tắm biển, ăn hải sản và ngắm hoàng hôn trên vịnh Thái Lan. Gánh hàng rong, chè và trái cây tạo nên không khí chợ biển đặc trưng.",
          en: "In the late afternoon, locals and visitors gather for a swim, seafood and sunset over the Gulf of Thailand — a distinctive seaside-market atmosphere.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Cát ở Mũi Nai có màu vàng nâu đặc trưng do nguồn đá gốc địa phương. Từ đường trên đồi, bạn có thể nhìn trọn vịnh và, trong những ngày trong trẻo, hòn đảo phía xa.",
          en: "The sand's distinctive golden-brown hue comes from local bedrock. From the hillside road you can see the whole bay — and on clear days, distant islands.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Mang kem chống nắng và nước uống, giữ vé để gửi xe thuận tiện. Kết hợp tham quan chùa Hang và đồi sim trên đường lên Mũi Nai.",
          en: "Bring sunscreen and water, and keep your parking ticket. Combine the trip with Hang Pagoda and the sim-flower hills on the way.",
        },
      },
    ],
    images: [
      { url: photo("mui-nai", 1), alt: "Mui Nai beach" },
      { url: photo("mui-nai", 2), alt: "Mui Nai coastline" },
      { url: photo("mui-nai", 3), alt: "Sunset at Mui Nai" },
    ],
  },
  {
    slug: "thach-dong",
    latitude: 10.41088913408602,
    longitude: 104.47479558933001,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    priceVnd: null,
    priceKind: "ticket",
    translations: {
      vi: {
        name: "Thạch Động",
        summary:
          "Hàng ngàn phiến đá chồng xếp tự nhiên tạo thành hang động kỳ vĩ gắn với nhiều truyền thuyết Hà Tiên.",
        address: "Ấp Thạch Sơn, Phường Mỹ Đức, TP. Hà Tiên, An Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Buổi sáng mát mẻ",
      },
      en: {
        name: "Thach Dong Cave",
        summary:
          "Thousands of naturally stacked stone slabs form a dramatic cave tied to many Ha Tien legends.",
        address: "Thach Son hamlet, My Duc ward, Ha Tien, An Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Cool morning hours",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Thạch Động — còn gọi là Thạch Sơn — là khối đá vôi cao khoảng 40 m nổi lên giữa đồng bằng, với hang xuyên núi nhìn ra biển. Đây là một trong tám cảnh nổi tiếng của Hà Tiên xưa.",
          en: "Thach Dong, also called Thach Son, is a 40-metre limestone block rising from the plain, pierced by a cave that opens toward the sea — one of old Ha Tien's celebrated sights.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Thời kỳ Mạc Cửu mở đất, Thạch Động là điểm quan sát cửa biển quan trọng. Sau này, trong hang còn lưu giữ nhiều dấu tích kháng chiến của thế kỷ XX.",
          en: "In Mac Cuu's era, Thach Dong served as an important lookout over the sea gate. The cave later preserved many resistance-era relics from the 20th century.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Trong hang có miếu nhỏ thờ Thánh Mẫu và gắn với truyền thuyết Tấm của phiên bản Hà Tiên — người con gái bị oan được người chài cứu. Người dân thường đến dâng hương cầu bình an.",
          en: "Inside sits a small shrine to the Holy Mother, tied to a Ha Tien version of the Tam folk tale — a wronged girl rescued by fishermen. Locals come to pray for safe journeys.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Các phiến đá chồng khít tự nhiên đến mức không cần vữa — dạng karst xếp phiến hiếm gặp. Trên đỉnh núi có cột đá trông như cổng trời.",
          en: "The slabs fit so tightly that no mortar is needed — a rare stacked-karst formation. On the summit, one column looks like a gate to the sky.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Mang giày đi bộ vì bậc đá trơn, xin phép trước khi chụp ảnh khu miếu. Ghé cùng Mũi Nai vì nằm trên cung đường phía nam thành phố.",
          en: "Wear walking shoes — the steps are slippery — and ask before photographing the shrine. Pair the visit with Mui Nai on the southern route.",
        },
      },
    ],
    images: [
      { url: photo("thach-dong", 1), alt: "Thach Dong cave" },
      { url: photo("thach-dong", 2), alt: "Stacked stones" },
      { url: photo("thach-dong", 3), alt: "View from Thach Dong" },
    ],
  },
  {
    slug: "chua-phu-dung",
    latitude: 10.388725448964237,
    longitude: 104.48281753988127,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    priceVnd: null,
    priceKind: "ticket",
    translations: {
      vi: {
        name: "Chùa Phù Dung",
        summary:
          "Ngôi chùa cổ trung tâm Hà Tiên với kiến trúc truyền thống và không gian yên tĩnh bên hồ Đông Hồ.",
        address: "Đường Phào Cừ, Phường Đông Hồ, TP. Hà Tiên, An Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Sáng sớm khi mở cổng chùa",
      },
      en: {
        name: "Phu Dung Pagoda",
        summary:
          "A historic pagoda in central Ha Tien with traditional architecture and a quiet setting near Dong Ho lake.",
        address: "Phao Cu street, Dong Ho ward, Ha Tien, An Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Early morning when gates open",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Chùa Phù Dung nằm ngay trung tâm thị xã, là một trong những ngôi chùa lâu đời nhất Hà Tiên. Sân chùa rộng, cây cổ thụ che bóng và tiếng chuông ngân mang lại cảm giác bình yên giữa phố thị.",
          en: "Phu Dung Pagoda sits in the town centre and is among Ha Tien's oldest temples. A broad courtyard, old trees and the bell's sound bring rare calm to the busy streets.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Chùa gắn với giai thoại cô gái Phù Dung thời Mạc Thiên Tích. Qua nhiều lần trùng tu, ngôi chùa vẫn giữ bố cục và nét chạm khắc truyền thống của vùng Hà Tiên.",
          en: "The pagoda is tied to the legend of a young woman named Phu Dung in the time of Mac Thien Tich. Despite many restorations, it keeps the traditional layout and carvings of old Ha Tien.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Vào rằm và lễ Phật đản, Phật tử khắp Hà Tiên tụ họp làm lễ tại đây. Chùa còn giữ nhiều hoành phi, câu đối cổ mang dấu ấn dòng họ Mạc.",
          en: "On full moons and Buddha's birthday, Buddhists from all over Ha Tien gather here. The pagoda preserves old horizontal boards and couplets bearing the Mac family's mark.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Từ cổng chùa nhìn ra hồ Đông Hồ — vào mùa nước nổi, cảnh chùa phản chiếu trên mặt nước rất đẹp. Nơi đây cách lăng Mạc Cửu chỉ vài phút đi bộ.",
          en: "The gate faces Dong Ho lake — in flood season the pagoda reflects beautifully on the water. Mac Cuu's tomb is only a few minutes' walk away.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Ăn mặc lịch sự và giữ yên tĩnh trong sân chùa. Kết hợp thăm lăng Mạc Cửu và đền thờ họ Mạc trong bán kính 500 m — cụm di tích trung tâm của thành phố.",
          en: "Dress modestly and keep quiet in the courtyard. Combine with Mac Cuu's tomb and the Mac family temple within 500 m — the city's central heritage cluster.",
        },
      },
    ],
    images: [
      { url: photo("chua-phu-dung", 1), alt: "Phu Dung Pagoda" },
      { url: photo("chua-phu-dung", 2), alt: "Pagoda courtyard" },
      { url: photo("chua-phu-dung", 3), alt: "Pagoda details" },
    ],
  },
  {
    slug: "lang-mac-cuu",
    latitude: 10.385736022455136,
    longitude: 104.48326149755424,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    priceVnd: null,
    priceKind: "ticket",
    translations: {
      vi: {
        name: "Lăng Mạc Cửu",
        summary:
          "Ngôi lăng của người mở đất Hà Tiên — Mạc Cửu — trên đồi Bình San giữa lòng thành phố.",
        address: "Đồi Bình San, Phường Bình San, TP. Hà Tiên, An Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Sáng sớm hoặc xế chiều",
      },
      en: {
        name: "Mac Cuu Mausoleum",
        summary:
          "The tomb of Ha Tien's founder Mac Cuu, set on Binh San hill in the middle of town.",
        address: "Binh San hill, Binh San ward, Ha Tien, An Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Early morning or late afternoon",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Lăng Mạc Cửu tọa lạc trên đồi Bình San — nơi an táng Mạc Cửu, người khai phá vùng đất Hà Tiên cuối thế kỷ XVII. Cả khu lăng quanh năm rợp bóng cây và hương hoa.",
          en: "The mausoleum stands on Binh San hill — the resting place of Mac Cuu, who opened up the Ha Tien region in the late 17th century. The grounds are shaded and flowered year-round.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Mạc Cửu (1655–1735), gốc người Lôi Châu, đã tập hợp lưu dân khai phá Hà Tiên thành thương cảng sầm uất, rồi dâng đất cho chúa Nguyễn và được phong Tổng binh trấn Hà Tiên.",
          en: "Mac Cuu (1655–1735), originally from Leizhou, gathered settlers and built Ha Tien into a busy trading port, then offered the land to the Nguyen lords, who made him its governor.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Hằng năm vào kỳ giỗ, dòng họ và người dân Hà Tiên làm lễ lâu đời tại lăng. Kiến trúc lăng kết hợp phong cách Hoa – Việt đặc trưng của vùng biên giới biển Tây.",
          en: "Every year on the death anniversary, the Mac family and townsfolk hold a long-standing ceremony here. The tomb blends Chinese and Vietnamese styles of this western coastal borderland.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Xung quanh lăng là mộ phần của nhiều đời họ Mạc — cả khu vực như một bảo tàng mở về lịch sử Hà Tiên. Con cháu họ Mạc vẫn sinh sống và giữ nghề truyền thống trong thành phố.",
          en: "Around the tomb lie generations of Mac family graves — the hill reads like an open-air museum of Ha Tien history. Mac descendants still live in town and keep traditional trades.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Đi bộ lên đồi qua cổng tam quan và giữ trật tự vì đây là nơi thờ tự. Đi tiếp 200 m đến đền thờ họ Mạc và chùa Tam Bảo trên cùng trục di tích.",
          en: "Walk up through the triple gate and keep the solemnity of the site. Continue 200 m to the Mac family temple and Tam Bao pagoda on the same heritage axis.",
        },
      },
    ],
    images: [
      { url: photo("lang-mac-cuu", 1), alt: "Mac Cuu mausoleum" },
      { url: photo("lang-mac-cuu", 2), alt: "Binh San hill" },
      { url: photo("lang-mac-cuu", 3), alt: "Mausoleum details" },
    ],
  },
  {
    slug: "den-tho-ho-mac",
    latitude: 10.385163225552366,
    longitude: 104.48319078420408,
    radiusMeters: 100,
    estimatedVisitMinutes: 20,
    priceVnd: null,
    priceKind: "ticket",
    translations: {
      vi: {
        name: "Khu Di Tích Lịch Sử Văn Hóa Núi Bình San — Đền Thờ Họ Mạc",
        summary:
          "Nơi thờ tự của dòng họ Mạc — gia tộc khai phá và cai quản Hà Tiên suốt hơn 100 năm.",
        address: "Đường Mạc Cửu, Phường Bình San, TP. Hà Tiên, An Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Buổi sáng",
      },
      en: {
        name: "Mac Family Temple",
        summary:
          "The ancestral temple of the Mac family — the clan that founded and ruled Ha Tien for over a century.",
        address: "Mac Cuu street, Binh San ward, Ha Tien, An Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Morning",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Đền thờ họ Mạc nằm ở chân đồi Bình San, thờ các thế hệ ông cha họ Mạc cùng những người có công với Hà Tiên. Nghiên đêm, án hương và hoành phi nơi đây đều mang giá trị nghệ thuật cổ.",
          en: "The Mac family temple sits at the foot of Binh San hill, honouring generations of the clan and Ha Tien's benefactors. Its altars, incense tables and boards carry old artistic value.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Sau khi Mạc Cửu mất, con cháu kế nghiệp cai quản Hà Tiên hơn 100 năm. Đền thờ là nơi tưởng niệm cả dòng tộc — từ Mạc Cửu, Mạc Thiên Tích đến các thế hệ sau.",
          en: "After Mac Cuu's death, his descendants governed Ha Tien for over a century. The temple commemorates the whole lineage — from Mac Cuu and Mac Thien Tich to later generations.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Lễ giỗ tổ họ Mạc diễn ra trang nghiêm với nghi thức truyền thống. Đây cũng là nơi diễn ra hoạt động văn hóa cộng đồng của người Hà Tiên gốc Hoa – Việt.",
          en: "The clan's memorial rites follow solemn traditional ceremonies. The temple is also a hub of community culture for Ha Tien's Chinese-Vietnamese residents.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: 'Cách đền không xa là miếu bà Cô Hiên — nhân vật huyền thoại gắn với tích trầu cau của Hà Tiên. Cả cụm di tích hình thành nên "phố cổ" nhỏ của thành phố.',
          en: "Nearby is the shrine of Lady Hien, a legendary figure tied to Ha Tien's betel-areca tale. Together the sites form the town's small 'old quarter'.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Ghé cùng lăng Mạc Cửu và chùa Tam Bảo trong một vòng đi bộ. Ăn mặc trang nhã, giữ trật tự khu thờ tự.",
          en: "Visit together with Mac Cuu's mausoleum and Tam Bao pagoda in one walking loop. Dress neatly and respect the worship areas.",
        },
      },
    ],
    images: [
      { url: photo("den-tho-ho-mac", 1), alt: "Mac family temple" },
      { url: photo("den-tho-ho-mac", 2), alt: "Temple altar" },
      { url: photo("den-tho-ho-mac", 3), alt: "Temple courtyard" },
    ],
  },
  {
    slug: "cho-ha-tien",
    latitude: 10.379543128732802,
    longitude: 104.48417352618934,
    radiusMeters: 150,
    estimatedVisitMinutes: 40,
    priceVnd: 50000,
    priceKind: "food",
    translations: {
      vi: {
        name: "Chợ Hà Tiên",
        summary:
          "Chợ và phố đêm bên kênh với hải sản tươi, đặc sản miệt vị và không khí chợ biên giới.",
        address: "Đường Dương Đông, Phường Đông Hồ, TP. Hà Tiên, An Giang",
        openingHours: "Chợ ngày: 6:00–18:00 · Phố đêm: 17:00–22:00",
        bestTimeToVisit: "Tối, khi phố đêm nhộn nhịp",
      },
      en: {
        name: "Ha Tien Market",
        summary:
          "A market and evening street by the canal with fresh seafood, local specialties and border-town buzz.",
        address: "Duong Dong street, Dong Ho ward, Ha Tien, An Giang",
        openingHours: "Day market 6:00–18:00 · Night street 17:00–22:00",
        bestTimeToVisit: "Evening, when the night street is lively",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Chợ Hà Tiên nằm bên kênh dẫn ra hồ Đông Hồ, là trung tâm mua sắm và ẩm thực của thành phố. Buổi tối, con đường ven kênh biến thành phố đêm với hàng loạt gánh hải sản, bún kị và bánh quai dầu.",
          en: "Ha Tien Market sits along the canal that feeds Dong Ho lake — the town's shopping and food hub. In the evening the canal road turns into a night street of seafood stalls, bun ki noodles and fried dough.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Hà Tiên xưa là thương cảng quốc tế sầm uất dưới thời Mạc Cửu, thương thuyền các nước đến buôn bán. Chợ ngày nay kế thừa vai trò ấy trên chính mảnh đất trăm năm.",
          en: "Under Mac Cuu, Ha Tien was a busy international trading port visited by ships from many countries. Today's market carries that role on the same historic ground.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Chợ phản chiếu nét pha trộn Việt – Hoa – Khmer của Hà Tiên: từ cách nêm nếm món ăn đến tiếng rao, mùi hương và nhịp sống ven kênh.",
          en: "The market mirrors Ha Tien's Vietnamese-Chinese-Khmer blend — in flavours, street calls, scents and the canal-side rhythm of life.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Bún kị Hà Tiên — nước lèo cá thơm được lên men tự nhiên — là món phải thử. Cá gàng, gỏi cá trích và bánh căn cũng là đặc sản không thể bỏ lỡ.",
          en: "Bun ki — rice noodles with a naturally fermented fish broth — is a must-try. Ganh fish, herring salad and banh can are local favourites too.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Hỏi giá trước khi gọi món, mang tiền mặt vì nhiều gánh hàng không nhận chuyển khoản. Ghé chợ sáng sớm để mua khô hải sản làm quà.",
          en: "Ask prices before ordering, bring cash — many stalls don't take transfers — and come early to buy dried seafood as gifts.",
        },
      },
    ],
    images: [
      { url: photo("cho-ha-tien", 1), alt: "Ha Tien market" },
      { url: photo("cho-ha-tien", 2), alt: "Night food street" },
      { url: photo("cho-ha-tien", 3), alt: "Seafood stalls" },
    ],
  },
  {
    slug: "nui-da-dung",
    latitude: 10.428538585209589,
    longitude: 104.47634339410202,
    radiusMeters: 100,
    estimatedVisitMinutes: 60,
    priceVnd: null,
    priceKind: "ticket",
    translations: {
      vi: {
        name: "Núi Đá Dựng",
        summary:
          "Rừng đá hàng trăm triệu năm với những khối đá chồng xếp kỳ lạ và đường mòn dẫn lên đỉnh ngắm toàn cảnh.",
        address: "Thôn Mỹ Đức, Xã Mỹ Đức, TP. Hà Tiên, An Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Sáng sớm, mát và đẹp nhất",
      },
      en: {
        name: "Da Dung Stone Forest",
        summary:
          "A hundred-million-year-old stone forest of bizarre stacked boulders with a trail to a hilltop panorama.",
        address: "My Duc hamlet, My Duc commune, Ha Tien, An Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Early morning, coolest and prettiest",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Núi Đá Dựng là quần thể đá đen kỳ vĩ cách trung tâm Hà Tiên khoảng 6 km về phía tây. Con đường mòn len qua các khối đá đưa bạn lên đỉnh — nơi có thể nhìn thấy biên giới và biển phía xa.",
          en: "Da Dung is a striking black-stone complex about 6 km west of Ha Tien centre. A trail winds between boulders up to the summit — with views toward the border and the distant sea.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Dưới thời Mạc Cửu, vùng núi này thuộc mạng lưới trấn giữ biên giới phía tây của trấn Hà Tiên. Những dấu tích lán trại và đạo lộ cũ vẫn được người dân nhắc đến.",
          en: "In Mac Cuu's time, this mountain was part of the western border guard network of the Ha Tien prefecture — locals still point out old posts and paths.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Người địa phương coi đá Dựng là linh vật của đất trời; nhiều câu ca dao, truyền thuyết kể về những tảng đá có hình người, hình thú được tự nhiên khắc tạc.",
          en: "Locals treat the stones as spirits of the land; folk rhymes and legends tell of boulders shaped like people and animals carved by nature itself.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Các khối đá được hình thành từ dòng dung nham cổ cách đây hàng trăm triệu năm, phong hóa thành hình thù độc đáo. Trên đỉnh có nhiều hang nhỏ để khám phá.",
          en: "The boulders formed from ancient lava flows hundreds of millions of years ago, weathered into unique shapes. The summit area hides many small caves to explore.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Mang giày trèo tốt, nước uống và đi theo đoàn. Không trèo đá sau mưa vì trơn. Kết hợp thăm chùa Hang ở chân núi.",
          en: "Bring sturdy shoes and water, stay in groups, and avoid climbing wet rocks. Pair the visit with Hang Pagoda at the mountain's foot.",
        },
      },
    ],
    images: [
      { url: photo("nui-da-dung", 1), alt: "Da Dung stone forest" },
      { url: photo("nui-da-dung", 2), alt: "Stacked boulders" },
      { url: photo("nui-da-dung", 3), alt: "Summit view" },
    ],
  },
  {
    slug: "bun-ken-nang",
    latitude: 10.3857,
    longitude: 104.4841,
    radiusMeters: 100,
    estimatedVisitMinutes: 40,
    priceVnd: 30000,
    priceKind: "food",
    translations: {
      vi: {
        name: "Bún Kèn Năng",
        summary:
          "Gánh bún kèn trứ danh: cá biển xào nghệ nấu nước cốt dừa béo ngậy, ăn kèm đu đủ bào giòn và nước mắm chua ngọt.",
        address: "Số 09 Mạc Tử Hoàng, Phường Bình San, TP. Hà Tiên, An Giang",
        openingHours: "6:00 – 11:00",
        bestTimeToVisit: "7:00 sáng, khi thỏi cá còn nóng hổi",
      },
      en: {
        name: "Bun Ken Nang",
        summary:
          "Ha Tien's famous bun ken stall: sea fish simmered in turmeric and rich coconut milk, served with crisp papaya slaw and sweet-sour fish sauce.",
        address: "09 Mac Tu Hoang, Binh San ward, Ha Tien, An Giang",
        openingHours: "6:00 – 11:00",
        bestTimeToVisit: "7:00 am, while the fish broth is still steaming",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Bún kèn là món sáng đặc trưng nhất của Hà Tiên: thịt cá lóc hoặc cá nhồng làm nhuyễn, xào tẩm nghệ thơm lừng rồi nấu cùng nước cốt dừa béo ngậy. Tô bún kèn ăn kèm đu đủ bào giòn, dưa leo, rau sống và chén nước mắm chua ngọt.",
          en: "Bun ken is Ha Tien's signature breakfast: minced snakehead or shark catfish stir-fried with fragrant turmeric, then simmered in rich coconut milk. The bowl comes with crisp pickled papaya, cucumber, fresh herbs and a sweet-sour fish-sauce dip.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Bún kèn ra đời từ nếp ăn sáng của cư dân chài lưới ven kênh Hà Tiên — cá đánh bắt trong ngày được chế biến ngay để giữ trọn vị tươi. Gánh bún kèn Năng là một trong những gánh lâu đời nhất thành phố.",
          en: "Bun ken grew from the breakfast habits of the fishing households along Ha Tien's canal — the day's catch was cooked immediately to keep its freshness. The Nang stall is among the town's oldest.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Chiếc tô bún kèn phản chiếu giao thoa Kinh – Khmer – Hoa: nghệ và nước cốt dừa của người Khmer, kỹ thuật làm cá của người Hoa, cách nêm mắm chua ngọt của người Kinh.",
          en: "A bowl of bun ken mirrors the Vietnamese-Khmer-Chinese blend: turmeric and coconut milk from Khmer cooking, fish technique from Chinese tradition, and the Vietnamese sweet-sour fish-sauce balance.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Tên gọi 'kèn' được nhiều người giải thích từ hình dáng thỏi cá xào nghệ cong như chiếc kèn. Đu đủ bào giòn trộn trong tô tạo độ sần đặc trưng không thể thay thế.",
          en: "The name 'ken' is often explained by the trumpet-like shape of the turmeric-stained fish sticks. The crisp shredded papaya mixed in gives an irreplaceable crunch.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Đến sớm trước 9:00 để kẻo hết cá. Ghé cùng hủ tiếu hấp Cô Ba trên trục Mạc Công Du — cụm ăn sáng trung tâm của thành phố.",
          en: "Come before 9:00 am — the fish sells out. Pair with the steamed noodle stall on Mac Cong Du: the town's central breakfast cluster.",
        },
      },
    ],
    images: [
      { url: photo("bun-ken-nang", 1), alt: "Bún kèn Hà Tiên" },
      { url: photo("bun-ken-nang", 2), alt: "Gánh bún kèn" },
      { url: photo("bun-ken-nang", 3), alt: "Tô bún kèn" },
    ],
  },
  {
    slug: "hut-tieu-hap-co-ba",
    latitude: 10.3838,
    longitude: 104.4862,
    radiusMeters: 100,
    estimatedVisitMinutes: 40,
    priceVnd: 40000,
    priceKind: "food",
    translations: {
      vi: {
        name: "Hủ Tiếu Hấp Cô Ba",
        summary:
          "Hủ tiếu hấp cách thủy thay vì trụng nước lèo, rưới nước cốt dừa thắng sánh cùng bì heo, chả giò và tôm khô.",
        address: "Số 56 Mạc Thiên Tích, Phường Bình San, TP. Hà Tiên, An Giang",
        openingHours: "6:30 – 11:30",
        bestTimeToVisit: "8:30 sáng",
      },
      en: {
        name: "Co Ba Steamed Noodles",
        summary:
          "Noodles steamed rather than boiled, dressed with silky coconut caramel, sliced pork belly, crispy spring rolls and dried shrimp.",
        address: "56 Mac Thien Tich, Binh San ward, Ha Tien, An Giang",
        openingHours: "6:30 – 11:30",
        bestTimeToVisit: "8:30 am",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Hủ tiếu hấp Hà Tiên không trụng qua nước lèo mà được hấp cách thủy, giữ sợi bún dai và khô ráo. Khi ăn, rưới nước cốt dừa thắng sánh mịn trộn cùng nước mắm chua ngọt, rắc bì heo thái sợi, tôm khô và chả giò giòn rụm.",
          en: "Ha Tien's steamed noodles never touch a broth pot — they are steamed to keep the strands springy and dry. Coconut caramel thinned with sweet-sour fish sauce is poured over, finished with sliced pork belly, dried shrimp and crispy spring rolls.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Món ăn mang đậm dấu ấn người Hoa tại Hà Tiên: kỹ thuật hấp từ ẩm thực Triều Châu kết hợp nước cốt dừa bản địa, tạo nên phiên bản hủ tiếu khô không lặp lại ở nơi khác.",
          en: "The dish bears the Chinese mark on Ha Tien: Teochew steaming technique blended with local coconut milk, producing a dry noodle version found nowhere else.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Các quán hủ tiếu hấp quanh trục Mạc Công Du – Mạc Thiên Tích do bà con gốc Hoa mở và giữ nghề qua nhiều đời, phục vụ cả người địa phương lẫn du khách.",
          en: "The steamed-noodle stalls around Mac Cong Du and Mac Thien Tich streets are run by Chinese-descendant families, with recipes handed down generations serving locals and visitors alike.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Nước cốt dừa được thắng trong nồi đất đến khi sánh như caramel — bí quyết quyết định chất lượng tô hủ tiếu hấp. Nhiều quán còn giã đậu phộng rắc thêm khi khách dặn.",
          en: "The coconut milk is caramelized in a clay pot until silky — the secret that decides the quality of each bowl. Some stalls also sprinkle crushed peanuts on request.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Gọi chung bàn với người địa phương nếu quán đông. Kết hợp bún kèn Năng gần đó cho một buổi sáng 'càn quét' ẩm thực Hà Tiên.",
          en: "Share tables with locals when the stall is crowded. Combine with the nearby bun ken stall for a morning sweep of Ha Tien's food scene.",
        },
      },
    ],
    images: [
      { url: photo("hut-tieu-hap-co-ba", 1), alt: "Hủ tiếu hấp" },
      { url: photo("hut-tieu-hap-co-ba", 2), alt: "Nước cốt dừa thắng" },
      { url: photo("hut-tieu-hap-co-ba", 3), alt: "Quán hủ tiếu hấp" },
    ],
  },
  {
    slug: "goi-ca-trich-ca-xiu",
    latitude: 10.3801,
    longitude: 104.4863,
    radiusMeters: 150,
    estimatedVisitMinutes: 60,
    priceVnd: 50000,
    priceKind: "food",
    translations: {
      vi: {
        name: "Gỏi Cá Trích & Cà Xỉu Xào Tỏi",
        summary:
          "Hương vị đầm Đông Hồ: gỏi cá trích tươi tái chanh trộn dừa nạo, cùng cà xỉu xào tỏi ớt bốc khói.",
        address: "Ven bờ sông quanh Cầu Tô Châu / đường Trần Hầu, TP. Hà Tiên, An Giang",
        openingHours: "10:00 – 14:00 · 17:00 – 21:00",
        bestTimeToVisit: "Buổi trưa, khi cá trích vừa cập bến",
      },
      en: {
        name: "Herring Salad & Stir-fried Ca Xiu",
        summary:
          "The flavours of Dong Ho lagoon: fresh herring salad tossed with shredded coconut, alongside smoking garlic stir-fried ca xiu clams.",
        address: "To Chau bridge riverside / Tran Hau street, Ha Tien, An Giang",
        openingHours: "10:00 – 14:00 · 17:00 – 21:00",
        bestTimeToVisit: "Lunchtime, when the herring just comes ashore",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Gỏi cá trích Hà Tiên dùng cá trích tươi đánh bắt trong ngày, tái chanh vừa đủ, trộn dừa nạo, đậu phộng rang và rau rừng. Cuốn bánh tráng chấm mắm nêm hoặc tương đậu phộng. Món ăn đôi không thể thiếu là cà xỉu xào tỏi — loài nhuyễn thể độc đáo chỉ có ở đầm Đông Hồ.",
          en: "Ha Tien's herring salad uses herring caught the same day, just-cured in lime, tossed with shredded coconut, roasted peanuts and wild herbs. Roll it in rice paper with fish-sauce dip or peanut sauce. Its inseparable partner is garlic stir-fried ca xiu — a mollusc unique to Dong Ho lagoon.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Đầm Đông Hồ từ thuở Mạc Cửu đã cung cấp hải sản cho thị trấn. Gỏi cá trích là món 'hao cơm' của dân chài, nay trở thành món nhắm nổi tiếng mà khách xa tìm về.",
          en: "Since Mac Cuu's era, Dong Ho lagoon has supplied the town with seafood. Herring salad was the fishermen's rice-sweeper, now a famous dish that draws travellers from afar.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Cà xỉu gắn với đời sống đầm phà của người Khmer ven đầm: săn cà xỉu mùa nước nổi, chế biến xào tỏi hoặc nướng cuốn lá chúc.",
          en: "Ca xiu is tied to the lagoon life of Khmer communities along its banks: harvested in flood season, cooked with garlic or grilled in lettuce wraps.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Cà xỉu có thịt mềm, vòi giòn sần sật — đặc tính có được nhờ môi trường nước lợ đầm Đông Hồ. Mắm cà xỉu đóng chai là đặc sản được nhiều du khách chọn mua về.",
          en: "Ca xiu has tender meat and a snappy, crunchy siphon — a quality owed to the brackish water of Dong Ho lagoon. Bottled ca xiu fish sauce is a popular souvenir.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Hỏi giá trước khi gọi món, ưu tiên quán đông người địa phương. Ghé cùng chợ Hà Tiên và phố đêm đường Trần Hầu ở cùng khu vực trung tâm.",
          en: "Ask prices before ordering and favour the stalls crowded with locals. The Ha Tien market and the Tran Hau night street are in the same central area.",
        },
      },
    ],
    images: [
      { url: photo("goi-ca-trich-ca-xiu", 1), alt: "Gỏi cá trích" },
      { url: photo("goi-ca-trich-ca-xiu", 2), alt: "Cà xỉu xào tỏi" },
      { url: photo("goi-ca-trich-ca-xiu", 3), alt: "Hải sản Đông Hồ" },
    ],
  },
  {
    slug: "banh-ong-la-dua",
    latitude: 10.3831,
    longitude: 104.4870,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    priceVnd: 25000,
    priceKind: "food",
    translations: {
      vi: {
        name: "Bánh Ống Lá Dứa & Bánh Bò Thốt Nốt",
        summary:
          "Quà bánh dạo phố: bánh ống lá dứa hấp trong ống nhôm nóng hổi và bánh bò thốt nốt vàng ươm xốp mềm.",
        address: "Xe gánh bánh dọc đường Trần Hầu, cổng Chợ Hà Tiên, An Giang",
        openingHours: "14:30 – 17:30",
        bestTimeToVisit: "15:30 xế chiều, khi bánh vừa hấp xong",
      },
      en: {
        name: "Pandan Tube Cakes & Palm-Sugar Bobo",
        summary:
          "Street-sweets of Ha Tien: pandan tube cakes steamed in hot aluminium moulds and golden, springy palm-sugar bobo cakes.",
        address: "Cake carts along Tran Hau street, at the Ha Tien market gate, An Giang",
        openingHours: "14:30 – 17:30",
        bestTimeToVisit: "3:30 pm, right after a fresh steaming batch",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Bánh ống Hà Tiên làm từ nếp xay trộn nước cốt lá dứa, hấp trong những ống nhôm nhỏ nóng hổi trên bếp than — ăn thơm nức mùi dứa và ngậy vị cùi dừa nạo. Bánh bò thốt nốt vàng ươm, xốp mềm, ngọt thanh vị đường thốt nốt nguyên chất.",
          en: "Ha Tien's tube cakes are glutinous rice flour blended with pandan juice, steamed in small aluminium moulds over charcoal — fragrant with pandan and rich with fresh coconut. The golden bobo cakes are springy and lightly sweet with pure palm sugar.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Bánh ống là phiên bản Việt hóa của bánh hấp ống người Khmer, kết hợp kỹ thuật hấp người Hoa và nguyên liệu thốt nốt bản địa của Hà Tiên.",
          en: "The tube cake is a Vietnamese take on the Khmer steamed khanom chin, blending Chinese steaming technique with Ha Tien's native palm sugar.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Những xe gánh bánh dạo quanh chợ là hình ảnh quen thuộc của xế chiều Hà Tiên — vừa gánh vừa rao, vừa hấp bánh tại chỗ cho khách mua.",
          en: "The cake carts around the market are a familiar late-afternoon sight in Ha Tien — carried on a pole, called aloud, with cakes steamed on the spot for each customer.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Bánh bò thốt nốt của Hà Tiên có màu vàng đẹp tự nhiên nhờ đường thốt nốt nguyên chất, không nhuộm màu. Đường thốt nốt bánh tròn đóng gói tại chợ là quà nổi tiếng.",
          en: "Ha Tien's bobo cakes get their natural golden colour from pure palm sugar, with no dye. Round packaged palm-sugar loaves at the market are a famous souvenir.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Mua tại xe gánh để ăn nóng hổi. Mang tiền mặt — gánh bánh không nhận chuyển khoản. Dạo tiếp phố đêm Trần Hầu ngay cạnh khi trời tối.",
          en: "Buy from the carts while the cakes are steaming hot. Bring cash — the carriers don't take transfers. Continue to the adjacent Tran Hau night street after dark.",
        },
      },
    ],
    images: [
      { url: photo("banh-ong-la-dua", 1), alt: "Bánh ống lá dứa" },
      { url: photo("banh-ong-la-dua", 2), alt: "Bánh bò thốt nốt" },
      { url: photo("banh-ong-la-dua", 3), alt: "Gánh bánh dạo phố" },
    ],
  },
  {
    slug: "xoi-xiem-ha-tien",
    latitude: 10.3832,
    longitude: 104.4871,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    priceVnd: 30000,
    priceKind: "food",
    translations: {
      vi: {
        name: "Xôi Xiêm Hà Tiên",
        summary:
          "Nếp Thái dẻo thơm rưới nhân hột gà hấp cốt dừa, ăn cùng xoài chín hoặc sầu riêng — món xế trứ danh của Hà Tiên.",
        address: "Đường Trần Hầu, cổng Chợ Hà Tiên, TP. Hà Tiên, An Giang",
        openingHours: "15:00 – 19:00",
        bestTimeToVisit: "16:00 chiều",
      },
      en: {
        name: "Ha Tien Sticky Rice Xiem",
        summary:
          "Fragrant sticky Siamese rice dressed with coconut-steamed custard, paired with ripe mango or durian — Ha Tien's famous street dessert.",
        address: "Tran Hau street, at the Ha Tien market gate, Ha Tien, An Giang",
        openingHours: "15:00 – 19:00",
        bestTimeToVisit: "4:00 pm",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Xôi xiêm Hà Tiên dùng nếp Thái dẻo thơm, hấp chín tới rồi rưới lớp nhân hột gà hấp cốt dừa sánh mịn. Món ăn kèm xoài chín tới hoặc múi sầu riêng tùy mùa — ngọt, béo, thơm trong một thập xôi nhỏ.",
          en: "Ha Tien's xiem sticky rice uses fragrant Siamese glutinous rice steamed to perfection, dressed with silky coconut-steamed custard. It pairs with ripe mango or durian segments in season — sweet, rich and aromatic in one small tray.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "'Xiêm' trong tên gọi dẫn từ nếp Thái (lúa xiêm) được thương thuyền Hà Tiên chuyển tải từ Xiêm La về trong thời kỳ thương cảng rộn ràng dưới thời Mạc Cửu.",
          en: "'Xiem' (Siamese) refers to the Siamese glutinous rice that Ha Tien's trading ships carried back from Siam during the busy port era under Mac Cuu.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Xôi xiêm là món quà chiều của người Hà Tiên: mẹ mua cho con, khách mua làm quà. Thập xôi nhỏ gọn dễ mang về, trở thành 'đặc sản cầm tay' của phố chợ.",
          en: "Xiem sticky rice is Ha Tien's afternoon gift: bought for children, bought as gifts. The compact tray travels well, making it the market street's handheld specialty.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Nhân hột gà hấp cốt dừa của xôi xiêm phải đánh đến khi sánh như sữa — bí quyết mỗi gánh xôi xiêm giữ riêng. Mùa xoài cát và mùa sầu riêng là hai mùa thơm nhất.",
          en: "The coconut custard must be beaten until silky as milk — each sticky-rice cart keeps its own recipe. Cat mango season and durian season are the two most aromatic times.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Ăn tại chỗ để cảm nhận độ dẻo của nếp và độ béo của nhân. Mua thêm bánh tráng thốt nốt hoặc đường thốt nốt bánh tròn làm quà ở chợ cạnh đó.",
          en: "Eat on site to enjoy the rice's springiness and the custard's richness. Pick up palm-sugar rice paper or round palm-sugar loaves as gifts at the adjacent market.",
        },
      },
    ],
    images: [
      { url: photo("xoi-xiem-ha-tien", 1), alt: "Xôi xiêm Hà Tiên" },
      { url: photo("xoi-xiem-ha-tien", 2), alt: "Nhân hột gà cốt dừa" },
      { url: photo("xoi-xiem-ha-tien", 3), alt: "Gánh xôi xiêm" },
    ],
  },
  {
    slug: "cho-dem-ha-tien-moi",
    latitude: 10.3752,
    longitude: 104.4815,
    radiusMeters: 150,
    estimatedVisitMinutes: 60,
    priceVnd: 80000,
    priceKind: "food",
    translations: {
      vi: {
        name: "Chợ Đêm Hà Tiên Mới",
        summary:
          "Khu ẩm thực đêm của đô thị mới bên sông: ốc giác, hải sản nướng, gà đốt Campuchia và chè thốt nốt cuối đêm.",
        address: "Số 6 Trần Hầu kéo dài, Khu đô thị mới Hà Tiên, An Giang",
        openingHours: "17:30 – 22:30",
        bestTimeToVisit: "Tối 18:30 – 21:30, khi các quầy đông nhất",
      },
      en: {
        name: "Ha Tien New Night Market",
        summary:
          "The new-town riverside night-food quarter: snail clams, grilled seafood, Cambodian-style fired chicken and late-night palm-sugar desserts.",
        address: "06 Tran Hau extended, New Urban Area, Ha Tien, An Giang",
        openingHours: "17:30 – 22:30",
        bestTimeToVisit: "Evenings 6:30–9:30 pm, when the stalls are liveliest",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Chợ đêm Hà Tiên Mới là điểm hẹn ẩm thực buổi tối của thành phố: hàng loạt quầy hải sản nướng, ốc giác, gà đốt và bánh ngọt dọc bờ sông trong khu đô thị mới. Đây là chặng cuối hoàn hảo cho một ngày food tour.",
          en: "The New Night Market is the town's evening food rendezvous: rows of grilled seafood, snail clams, fired chicken and sweets along the riverside of the new urban quarter. A perfect closing stop for a one-day food tour.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Phố đêm Trần Hầu xưa là chợ bến nước của thương cảng Mạc Cửu; khi đô thị mới mở rộng về phía nam, chợ đêm theo dòng khách vào khu đô thị mới bên sông nhưng vẫn giữ hồn chợ biên giới.",
          en: "The old Tran Hau night street was Mac Cuu's river-port market; as the town grew south, the night market followed its crowds to the new riverside quarter — keeping the border-town market spirit.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Gà đốt Campuchia ướp sả, lá chúc và ớt đốt trong nồi đất là dấu ấn văn hóa ảnh hưởng từ bên kia biên giới; ốc giác và ghẹ hấp sả ớt là phiên bản Hà Tiên của hải sản đồng bằng sông Cửu Long.",
          en: "Cambodian-style fired chicken with lemongrass, chúc leaves and chilli cooked in a clay pot carries the cross-border influence; snail clams and lemongrass-steamed mud crabs are Ha Tien's Mekong-Delta seafood take.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Ốc giác — loài ốc lớn của vùng nước lợ — luộc chấm muối tiêu chanh hoặc xào sa tế đều thơm. Chè thốt nốt sữa tươi và dừa nước đá đường là món tráng miệng cuối đêm quen thuộc.",
          en: "The region's large brackish-water snail is equally good boiled with lime-pepper salt or stir-fried in chilli paste. Palm-sugar milk dessert and iced coconut are the classic late-night finishers.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Hỏi giá trước khi gọi món và mang tiền mặt. Đi theo nhóm để gọi chung hải sản nướng và gà đốt; về muộn nhớ đặt xe trở về trung tâm.",
          en: "Ask prices before ordering and bring cash. Come in a group to share grilled seafood and fired chicken; arrange a ride back to the centre if you stay late.",
        },
      },
    ],
    images: [
      { url: photo("cho-dem-ha-tien-moi", 1), alt: "Chợ đêm Hà Tiên Mới" },
      { url: photo("cho-dem-ha-tien-moi", 2), alt: "Hải sản nướng" },
      { url: photo("cho-dem-ha-tien-moi", 3), alt: "Gà đốt Campuchia" },
    ],
  },
  {
    slug: "hut-tieu-nam-vang-quen",
    latitude: 10.382928396269891,
    longitude: 104.4885526254068,
    radiusMeters: 100,
    estimatedVisitMinutes: 40,
    priceVnd: null,
    priceKind: "ticket",
    translations: {
      vi: {
        name: "Hủ Tiếu Nam Vang Quến Hà Tiên",
        summary:
          "Tô hủ tiếu nam vang trứ danh với tôm, thịt, gan, trứng cút và nước dùng ngọt xương — thương hiệu lâu đời của Hà Tiên.",
        address: "Đường Chi Lăng, Phường Bình San, TP. Hà Tiên, An Giang",
        openingHours: "6:00 – 11:00",
        bestTimeToVisit: "Buổi sáng, khi nước dùng vừa sánh xong",
      },
      en: {
        name: "Nam Vang Quern Hu Tieu, Ha Tien",
        summary:
          "The town's famed nam vang noodle bowl — shrimp, sliced pork, liver and quail eggs in a rich bone broth — a long-standing Ha Tien brand.",
        address: "Chi Lang street, Binh San ward, Ha Tien, An Giang",
        openingHours: "6:00 – 11:00",
        bestTimeToVisit: "In the morning, while the broth is fresh off the pot",
      },
    },
    guides: [
      {
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Hủ tiếu nam vang Quến là một trong những thương hiệu hủ tiếu lâu đời nhất Hà Tiên. Tô bún đặc trưng với tôm tươi, thịt heo thái lát, gan, trứng cút, hành tây và cần tây trên nền nước dùng ngọt xương đậm đà.",
          en: "Nam Vang Quern is one of Ha Tien's longest-standing noodle houses. The signature bowl layers fresh shrimp, sliced pork, liver and quail eggs with onion and celery over a rich, meaty bone broth.",
        },
      },
      {
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Nam vang (Phnôm Pênh) du nhập vào Hà Tiên qua đường thương mại biên giới, được các gia đình gốc Hoa tại đây chế biến lại theo khẩu vị sông nước — gầy nên phiên bản hủ tiếu nam vang riêng của Hà Tiên.",
          en: "Nam vang (Phnom Penh) noodles reached Ha Tien via cross-border trade and were reworked by local Chinese families to river-town tastes — creating the town's own nam vang style.",
        },
      },
      {
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Cùng với bún kèn và hủ tiếu hấp, nam vang Quến thuộc 'bộ ba' bữa sáng của người Hà Tiên — nơi ba thế hệ cùng ngồi chung một quán trước giờ làm.",
          en: "Alongside bun ken and steamed noodles, Nam Vang Quern belongs to Ha Tien's breakfast trio — three generations sharing one table before the workday begins.",
        },
      },
      {
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Khác biệt của nam vang Hà Tiên nằm ở nước dùng nấu xương trong nhiều giờ, ít ngọt nhân tạo hơn bản gốc Phnôm Pênh, và luôn kèm đĩa rau sống kiarow (rau hung bài) đặc trưng.",
          en: "The Ha Tien difference is a broth simmered for hours with less added sugar than the Phnom Penh original, always served with the local kiarow herb plate.",
        },
      },
      {
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Đến trước 10:00 để kịp tô nam vang đầy đủ topping. Ghé cùng cụm bún kèn — hủ tiếu hấp trong vòng 500 m để 'càn quét' đủ ba món sáng của thành phố.",
          en: "Arrive before 10:00 am for a fully topped bowl. It sits within 500 m of the bun ken and steamed-noodle cluster — an easy morning sweep of the town's three breakfast classics.",
        },
      },
    ],
    images: [
      { url: photo("hut-tieu-nam-vang-quen", 1), alt: "Hủ tiếu nam vang" },
      { url: photo("hut-tieu-nam-vang-quen", 2), alt: "Topping nam vang" },
      { url: photo("hut-tieu-nam-vang-quen", 3), alt: "Quán hủ tiếu Quến" },
    ],
  },
];

export interface SeedTour {
  slug: string;
  translations: Record<
    SeedLocale,
    {
      name: string;
      tagline: string;
      description: string;
      coverImageUrl: string;
    }
  >;
  checkpointSlugs: string[];
}

export const seedTours: SeedTour[] = [
  {
    slug: "ha-tien-discovery",
    translations: {
      vi: {
        name: "Khám phá Hà Tiên",
        tagline: "Hành trình qua vùng đất thi ca bên vịnh Thái Lan",
        description:
          "Từ biển Mũi Nai đến rừng đá Dựng, tour đưa bạn qua 7 điểm dừng tiêu biểu nhất của Hà Tiên: biển, chùa, lăng cổ và chợ đêm — nơi khởi đầu câu chuyện Mạc Cửu mở đất hơn 300 năm trước.",
        coverImageUrl: photo("ha-tien-discovery", 1),
      },
      en: {
        name: "Ha Tien Discovery",
        tagline: "A journey through the land of poetry on the Gulf of Thailand",
        description:
          "From Mui Nai beach to the Da Dung stone forest, this tour covers Ha Tien's 7 signature stops — beaches, pagodas, historic tombs and the night market — where Mac Cuu's 300-year-old story began.",
        coverImageUrl: photo("ha-tien-discovery", 1),
      },
    },
    checkpointSlugs: [
      "mui-nai",
      "thach-dong",
      "chua-phu-dung",
      "lang-mac-cuu",
      "den-tho-ho-mac",
      "cho-ha-tien",
      "nui-da-dung",
    ],
  },
  {
    slug: "ha-tien-beach-day",
    translations: {
      vi: {
        name: "Ngày tại biển Hà Tiên",
        tagline: "Cát, biển và hoàng hôn bên vịnh",
        description:
          "Một ngày thư giãn ven biển Hà Tiên: tắm biển Mũi Nai sáng sớm, khám phá chợ Hà Tiên buổi xế và thưởng thức hải sản tươi khi hoàng hôn buông trên vịnh Thái Lan. Phù hợp cho gia đình và du khách yêu biển.",
        coverImageUrl: photo("ha-tien-beach-day", 1),
      },
      en: {
        name: "Ha Tien Beach Day",
        tagline: "Sand, sea and sunset by the gulf",
        description:
          "A relaxed seaside day in Ha Tien: swim at Mui Nai in the morning, explore Ha Tien Market in the afternoon, then enjoy fresh seafood as the sun sets over the Gulf of Thailand. Great for families and sea lovers.",
        coverImageUrl: photo("ha-tien-beach-day", 1),
      },
    },
    checkpointSlugs: ["mui-nai", "cho-ha-tien"],
  },
  {
    slug: "ha-tien-culture-walk",
    translations: {
      vi: {
        name: "Lộ trình khám phá văn hóa",
        tagline: "Chùa, lăng và rừng đá — lịch sử Hà Tiên",
        description:
          "Hành trình di sản của Hà Tiên: rừng đá Thạch Động, chùa Phù Dung, lăng Mạc Cửu, đền thờ họ Mạc và núi Đá Dựng — những cảnh quan từng khơi nguồn thi ca của miền đất biên viễn này.",
        coverImageUrl: photo("ha-tien-culture-walk", 1),
      },
      en: {
        name: "Ha Tien Culture Walk",
        tagline: "Pagodas, tombs and stone forests — the story of Ha Tien",
        description:
          "The heritage trail of Ha Tien: the Thach Dong stone forest, Phu Dung Temple, Mac Cuu's mausoleum, Ho Mac shrine and Da Dung Mountain — the landscapes that inspired the town's poetry.",
        coverImageUrl: photo("ha-tien-culture-walk", 1),
      },
    },
    checkpointSlugs: [
      "thach-dong",
      "chua-phu-dung",
      "lang-mac-cuu",
      "den-tho-ho-mac",
      "nui-da-dung",
    ],
  },
  {
    slug: "ha-tien-food-tour",
    translations: {
      vi: {
        name: "Food Tour Hà Tiên",
        tagline: "Giao thoa Kinh – Khmer – Hoa trong một ngày ăn uống",
        description:
          "Lịch trình ẩm thực trọn một ngày: bún kèn sáng sớm, hủ tiếu hấp nước cốt dừa, gỏi cá trích và cà xỉu đầm Đông Hồ, bánh ống lá dứa và xôi xiêm xế chiều, khép lại bằng hải sản nướng và gà đốt Campuchia ở chợ đêm Trần Hầu.",
        coverImageUrl: photo("ha-tien-food-tour", 1),
      },
      en: {
        name: "Ha Tien Food Tour",
        tagline: "Vietnamese-Khmer-Chinese flavours in one day of eating",
        description:
          "A full-day eating itinerary: early-morning bun ken, coconut-milk steamed noodles, Dong Ho herring salad and ca xiu clams, afternoon pandan tube cakes and sticky rice — finishing with grilled seafood and Cambodian-style fired chicken at the Tran Hau night market.",
        coverImageUrl: photo("ha-tien-food-tour", 1),
      },
    },
    checkpointSlugs: [
      "bun-ken-nang",
      "hut-tieu-hap-co-ba",
      "hut-tieu-nam-vang-quen",
      "goi-ca-trich-ca-xiu",
      "banh-ong-la-dua",
      "xoi-xiem-ha-tien",
      "cho-dem-ha-tien-moi",
    ],
  },
];
