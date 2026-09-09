/**
 * DEMO SEED DATA — Hà Tiên Discovery (Plan.md §11).
 *
 * Realistic but DEMO: coordinates are approximate and photos are placeholders
 * (picsum.photos). An admin must verify coordinates, opening hours and copy
 * before using this as production content.
 */

export type SeedLocale = "vi" | "en";

export interface SeedGuideSection {
  sectionKey:
    | "introduction"
    | "history"
    | "culture"
    | "interesting_facts"
    | "travel_tips";
  title: Record<SeedLocale, string>;
  content: Record<SeedLocale, string>;
}

export interface SeedCheckpoint {
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
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
    latitude: 10.3899,
    longitude: 104.5072,
    radiusMeters: 100,
    estimatedVisitMinutes: 45,
    translations: {
      vi: {
        name: "Mũi Nai",
        summary:
          "Bãi biển nổi tiếng nhất Hà Tiên với triền cát vàng nâu, làn nước trong xanh và đường quanh co trên đồi.",
        address: "Phường Phú Hải, TP. Hà Tiên, Kiên Giang",
        openingHours: "Cả ngày",
        bestTimeToVisit: "Sáng sớm hoặc chiều hoàng hôn",
      },
      en: {
        name: "Mui Nai Beach",
        summary:
          "Ha Tien's best-known beach with golden-brown sand, clear water and a winding hillside road.",
        address: "Phu Hai ward, Ha Tien, Kien Giang",
        openingHours: "All day",
        bestTimeToVisit: "Early morning or sunset",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Mũi Nai nằm cách trung tâm Hà Tiên khoảng 3 km về phía đông nam, là bãi tắm nổi bật nhất của thành phố biển này. Triền cát thoải, nước trong và hàng quán ven bờ khiến nơi đây phù hợp cho cả gia đình.",
          en: "Mui Nai lies about 3 km southeast of central Ha Tien and is the town's best-known swimming beach. Gentle sand, clear water and beachfront stalls make it a great family stop.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Tên gọi Mũi Nai xuất hiện trong mười bài thơ nổi tiếng \"Hà Tiên thập vịnh\" của Mạc Thiên Tích thế kỷ XVIII — nơi đây xưa là bến nước gắn với đời sống cư dân ven biển.",
          en: "Mui Nai appears in the famous 18th-century poem cycle 'Ten Verses on Ha Tien' by Mac Thien Tich — long a landmark tied to the daily life of coastal communities.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Chiều muộn, người dân và du khách tụ về Mũi Nai tắm biển, ăn hải sản và ngắm hoàng hôn trên vịnh Thái Lan. Gánh hàng rong, chè và trái cây tạo nên không khí chợ biển đặc trưng.",
          en: "In the late afternoon, locals and visitors gather for a swim, seafood and sunset over the Gulf of Thailand — a distinctive seaside-market atmosphere.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Cát ở Mũi Nai có màu vàng nâu đặc trưng do nguồn đá gốc địa phương. Từ đường trên đồi, bạn có thể nhìn trọn vịnh và, trong những ngày trong trẻo, hòn đảo phía xa.",
          en: "The sand's distinctive golden-brown hue comes from local bedrock. From the hillside road you can see the whole bay — and on clear days, distant islands.",
        },
      },
      {
        sectionKey: "travel_tips",
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
    latitude: 10.3725,
    longitude: 104.4975,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    translations: {
      vi: {
        name: "Thạch Động",
        summary:
          "Hàng ngàn phiến đá chồng xếp tự nhiên tạo thành hang động kỳ vĩ gắn với nhiều truyền thuyết Hà Tiên.",
        address: "Ấp Thạch Sơn, Phường Mỹ Đức, TP. Hà Tiên, Kiên Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Buổi sáng mát mẻ",
      },
      en: {
        name: "Thach Dong Cave",
        summary:
          "Thousands of naturally stacked stone slabs form a dramatic cave tied to many Ha Tien legends.",
        address: "Thach Son hamlet, My Duc ward, Ha Tien, Kien Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Cool morning hours",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Thạch Động — còn gọi là Thạch Sơn — là khối đá vôi cao khoảng 40 m nổi lên giữa đồng bằng, với hang xuyên núi nhìn ra biển. Đây là một trong tám cảnh nổi tiếng của Hà Tiên xưa.",
          en: "Thach Dong, also called Thach Son, is a 40-metre limestone block rising from the plain, pierced by a cave that opens toward the sea — one of old Ha Tien's celebrated sights.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Thời kỳ Mạc Cửu mở đất, Thạch Động là điểm quan sát cửa biển quan trọng. Sau này, trong hang còn lưu giữ nhiều dấu tích kháng chiến của thế kỷ XX.",
          en: "In Mac Cuu's era, Thach Dong served as an important lookout over the sea gate. The cave later preserved many resistance-era relics from the 20th century.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Trong hang có miếu nhỏ thờ Thánh Mẫu và gắn với truyền thuyết Tấm của phiên bản Hà Tiên — người con gái bị oan được người chài cứu. Người dân thường đến dâng hương cầu bình an.",
          en: "Inside sits a small shrine to the Holy Mother, tied to a Ha Tien version of the Tam folk tale — a wronged girl rescued by fishermen. Locals come to pray for safe journeys.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Các phiến đá chồng khít tự nhiên đến mức không cần vữa — dạng karst xếp phiến hiếm gặp. Trên đỉnh núi có cột đá trông như cổng trời.",
          en: "The slabs fit so tightly that no mortar is needed — a rare stacked-karst formation. On the summit, one column looks like a gate to the sky.",
        },
      },
      {
        sectionKey: "travel_tips",
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
    latitude: 10.3845,
    longitude: 104.481,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    translations: {
      vi: {
        name: "Chùa Phù Dung",
        summary:
          "Ngôi chùa cổ trung tâm Hà Tiên với kiến trúc truyền thống và không gian yên tĩnh bên hồ Đông Hồ.",
        address: "Đường Phào Cừ, Phường Đông Hồ, TP. Hà Tiên, Kiên Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Sáng sớm khi mở cổng chùa",
      },
      en: {
        name: "Phu Dung Pagoda",
        summary:
          "A historic pagoda in central Ha Tien with traditional architecture and a quiet setting near Dong Ho lake.",
        address: "Phao Cu street, Dong Ho ward, Ha Tien, Kien Giang",
        openingHours: "6:00 – 18:00",
        bestTimeToVisit: "Early morning when gates open",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Chùa Phù Dung nằm ngay trung tâm thị xã, là một trong những ngôi chùa lâu đời nhất Hà Tiên. Sân chùa rộng, cây cổ thụ che bóng và tiếng chuông ngân mang lại cảm giác bình yên giữa phố thị.",
          en: "Phu Dung Pagoda sits in the town centre and is among Ha Tien's oldest temples. A broad courtyard, old trees and the bell's sound bring rare calm to the busy streets.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Chùa gắn với giai thoại cô gái Phù Dung thời Mạc Thiên Tích. Qua nhiều lần trùng tu, ngôi chùa vẫn giữ bố cục và nét chạm khắc truyền thống của vùng Hà Tiên.",
          en: "The pagoda is tied to the legend of a young woman named Phu Dung in the time of Mac Thien Tich. Despite many restorations, it keeps the traditional layout and carvings of old Ha Tien.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Vào rằm và lễ Phật đản, Phật tử khắp Hà Tiên tụ họp làm lễ tại đây. Chùa còn giữ nhiều hoành phi, câu đối cổ mang dấu ấn dòng họ Mạc.",
          en: "On full moons and Buddha's birthday, Buddhists from all over Ha Tien gather here. The pagoda preserves old horizontal boards and couplets bearing the Mac family's mark.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Từ cổng chùa nhìn ra hồ Đông Hồ — vào mùa nước nổi, cảnh chùa phản chiếu trên mặt nước rất đẹp. Nơi đây cách lăng Mạc Cửu chỉ vài phút đi bộ.",
          en: "The gate faces Dong Ho lake — in flood season the pagoda reflects beautifully on the water. Mac Cuu's tomb is only a few minutes' walk away.",
        },
      },
      {
        sectionKey: "travel_tips",
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
    latitude: 10.3858,
    longitude: 104.4822,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    translations: {
      vi: {
        name: "Lăng Mạc Cửu",
        summary:
          "Ngôi lăng của người mở đất Hà Tiên — Mạc Cửu — trên đồi Bình San giữa lòng thành phố.",
        address: "Đồi Bình San, Phường Bình San, TP. Hà Tiên, Kiên Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Sáng sớm hoặc xế chiều",
      },
      en: {
        name: "Mac Cuu Mausoleum",
        summary:
          "The tomb of Ha Tien's founder Mac Cuu, set on Binh San hill in the middle of town.",
        address: "Binh San hill, Binh San ward, Ha Tien, Kien Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Early morning or late afternoon",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Lăng Mạc Cửu tọa lạc trên đồi Bình San — nơi an táng Mạc Cửu, người khai phá vùng đất Hà Tiên cuối thế kỷ XVII. Cả khu lăng quanh năm rợp bóng cây và hương hoa.",
          en: "The mausoleum stands on Binh San hill — the resting place of Mac Cuu, who opened up the Ha Tien region in the late 17th century. The grounds are shaded and flowered year-round.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Mạc Cửu (1655–1735), gốc người Lôi Châu, đã tập hợp lưu dân khai phá Hà Tiên thành thương cảng sầm uất, rồi dâng đất cho chúa Nguyễn và được phong Tổng binh trấn Hà Tiên.",
          en: "Mac Cuu (1655–1735), originally from Leizhou, gathered settlers and built Ha Tien into a busy trading port, then offered the land to the Nguyen lords, who made him its governor.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Hằng năm vào kỳ giỗ, dòng họ và người dân Hà Tiên làm lễ lâu đời tại lăng. Kiến trúc lăng kết hợp phong cách Hoa – Việt đặc trưng của vùng biên giới biển Tây.",
          en: "Every year on the death anniversary, the Mac family and townsfolk hold a long-standing ceremony here. The tomb blends Chinese and Vietnamese styles of this western coastal borderland.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Xung quanh lăng là mộ phần của nhiều đời họ Mạc — cả khu vực như một bảo tàng mở về lịch sử Hà Tiên. Con cháu họ Mạc vẫn sinh sống và giữ nghề truyền thống trong thành phố.",
          en: "Around the tomb lie generations of Mac family graves — the hill reads like an open-air museum of Ha Tien history. Mac descendants still live in town and keep traditional trades.",
        },
      },
      {
        sectionKey: "travel_tips",
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
    latitude: 10.3838,
    longitude: 104.4833,
    radiusMeters: 100,
    estimatedVisitMinutes: 20,
    translations: {
      vi: {
        name: "Đền thờ họ Mạc",
        summary:
          "Nơi thờ tự của dòng họ Mạc — gia tộc khai phá và cai quản Hà Tiên suốt hơn 100 năm.",
        address: "Đường Mạc Cửu, Phường Bình San, TP. Hà Tiên, Kiên Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Buổi sáng",
      },
      en: {
        name: "Mac Family Temple",
        summary:
          "The ancestral temple of the Mac family — the clan that founded and ruled Ha Tien for over a century.",
        address: "Mac Cuu street, Binh San ward, Ha Tien, Kien Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Morning",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Đền thờ họ Mạc nằm ở chân đồi Bình San, thờ các thế hệ ông cha họ Mạc cùng những người có công với Hà Tiên. Nghiên đêm, án hương và hoành phi nơi đây đều mang giá trị nghệ thuật cổ.",
          en: "The Mac family temple sits at the foot of Binh San hill, honouring generations of the clan and Ha Tien's benefactors. Its altars, incense tables and boards carry old artistic value.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Sau khi Mạc Cửu mất, con cháu kế nghiệp cai quản Hà Tiên hơn 100 năm. Đền thờ là nơi tưởng niệm cả dòng tộc — từ Mạc Cửu, Mạc Thiên Tích đến các thế hệ sau.",
          en: "After Mac Cuu's death, his descendants governed Ha Tien for over a century. The temple commemorates the whole lineage — from Mac Cuu and Mac Thien Tich to later generations.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Lễ giỗ tổ họ Mạc diễn ra trang nghiêm với nghi thức truyền thống. Đây cũng là nơi diễn ra hoạt động văn hóa cộng đồng của người Hà Tiên gốc Hoa – Việt.",
          en: "The clan's memorial rites follow solemn traditional ceremonies. The temple is also a hub of community culture for Ha Tien's Chinese-Vietnamese residents.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Cách đền không xa là miếu bà Cô Hiên — nhân vật huyền thoại gắn với tích trầu cau của Hà Tiên. Cả cụm di tích hình thành nên \"phố cổ\" nhỏ của thành phố.",
          en: "Nearby is the shrine of Lady Hien, a legendary figure tied to Ha Tien's betel-areca tale. Together the sites form the town's small 'old quarter'.",
        },
      },
      {
        sectionKey: "travel_tips",
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
    latitude: 10.3865,
    longitude: 104.4848,
    radiusMeters: 150,
    estimatedVisitMinutes: 40,
    translations: {
      vi: {
        name: "Chợ Hà Tiên",
        summary:
          "Chợ và phố đêm bên kênh với hải sản tươi, đặc sản miệt vị và không khí chợ biên giới.",
        address: "Đường Dương Đông, Phường Đông Hồ, TP. Hà Tiên, Kiên Giang",
        openingHours: "Chợ ngày: 6:00–18:00 · Phố đêm: 17:00–22:00",
        bestTimeToVisit: "Tối, khi phố đêm nhộn nhịp",
      },
      en: {
        name: "Ha Tien Market",
        summary:
          "A market and evening street by the canal with fresh seafood, local specialties and border-town buzz.",
        address: "Duong Dong street, Dong Ho ward, Ha Tien, Kien Giang",
        openingHours: "Day market 6:00–18:00 · Night street 17:00–22:00",
        bestTimeToVisit: "Evening, when the night street is lively",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Chợ Hà Tiên nằm bên kênh dẫn ra hồ Đông Hồ, là trung tâm mua sắm và ẩm thực của thành phố. Buổi tối, con đường ven kênh biến thành phố đêm với hàng loạt gánh hải sản, bún kị và bánh quai dầu.",
          en: "Ha Tien Market sits along the canal that feeds Dong Ho lake — the town's shopping and food hub. In the evening the canal road turns into a night street of seafood stalls, bun ki noodles and fried dough.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Hà Tiên xưa là thương cảng quốc tế sầm uất dưới thời Mạc Cửu, thương thuyền các nước đến buôn bán. Chợ ngày nay kế thừa vai trò ấy trên chính mảnh đất trăm năm.",
          en: "Under Mac Cuu, Ha Tien was a busy international trading port visited by ships from many countries. Today's market carries that role on the same historic ground.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Chợ phản chiếu nét pha trộn Việt – Hoa – Khmer của Hà Tiên: từ cách nêm nếm món ăn đến tiếng rao, mùi hương và nhịp sống ven kênh.",
          en: "The market mirrors Ha Tien's Vietnamese-Chinese-Khmer blend — in flavours, street calls, scents and the canal-side rhythm of life.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Bún kị Hà Tiên — nước lèo cá thơm được lên men tự nhiên — là món phải thử. Cá gàng, gỏi cá trích và bánh căn cũng là đặc sản không thể bỏ lỡ.",
          en: "Bun ki — rice noodles with a naturally fermented fish broth — is a must-try. Ganh fish, herring salad and banh can are local favourites too.",
        },
      },
      {
        sectionKey: "travel_tips",
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
    latitude: 10.3908,
    longitude: 104.465,
    radiusMeters: 100,
    estimatedVisitMinutes: 60,
    translations: {
      vi: {
        name: "Núi Đá Dựng",
        summary:
          "Rừng đá hàng trăm triệu năm với những khối đá chồng xếp kỳ lạ và đường mòn dẫn lên đỉnh ngắm toàn cảnh.",
        address: "Thôn Mỹ Đức, Xã Mỹ Đức, TP. Hà Tiên, Kiên Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Sáng sớm, mát và đẹp nhất",
      },
      en: {
        name: "Da Dung Stone Forest",
        summary:
          "A hundred-million-year-old stone forest of bizarre stacked boulders with a trail to a hilltop panorama.",
        address: "My Duc hamlet, My Duc commune, Ha Tien, Kien Giang",
        openingHours: "6:30 – 17:30",
        bestTimeToVisit: "Early morning, coolest and prettiest",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Núi Đá Dựng là quần thể đá đen kỳ vĩ cách trung tâm Hà Tiên khoảng 6 km về phía tây. Con đường mòn len qua các khối đá đưa bạn lên đỉnh — nơi có thể nhìn thấy biên giới và biển phía xa.",
          en: "Da Dung is a striking black-stone complex about 6 km west of Ha Tien centre. A trail winds between boulders up to the summit — with views toward the border and the distant sea.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Dưới thời Mạc Cửu, vùng núi này thuộc mạng lưới trấn giữ biên giới phía tây của trấn Hà Tiên. Những dấu tích lán trại và đạo lộ cũ vẫn được người dân nhắc đến.",
          en: "In Mac Cuu's time, this mountain was part of the western border guard network of the Ha Tien prefecture — locals still point out old posts and paths.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Người địa phương coi đá Dựng là linh vật của đất trời; nhiều câu ca dao, truyền thuyết kể về những tảng đá có hình người, hình thú được tự nhiên khắc tạc.",
          en: "Locals treat the stones as spirits of the land; folk rhymes and legends tell of boulders shaped like people and animals carved by nature itself.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Các khối đá được hình thành từ dòng dung nham cổ cách đây hàng trăm triệu năm, phong hóa thành hình thù độc đáo. Trên đỉnh có nhiều hang nhỏ để khám phá.",
          en: "The boulders formed from ancient lava flows hundreds of millions of years ago, weathered into unique shapes. The summit area hides many small caves to explore.",
        },
      },
      {
        sectionKey: "travel_tips",
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
    slug: "bai-bien-binh-san",
    latitude: 10.3828,
    longitude: 104.4865,
    radiusMeters: 100,
    estimatedVisitMinutes: 45,
    translations: {
      vi: {
        name: "Bãi biển Bình San",
        summary:
          "Bãi biển yên tĩnh gần trung tâm với hàng dừa nước và hoàng hôn trên vịnh Thái Lan.",
        address: "Phường Bình San, TP. Hà Tiên, Kiên Giang",
        openingHours: "Cả ngày",
        bestTimeToVisit: "Chiều muộn ngắm hoàng hôn",
      },
      en: {
        name: "Binh San Beach",
        summary:
          "A quiet beach near the centre lined with coconut palms and sunsets over the Gulf of Thailand.",
        address: "Binh San ward, Ha Tien, Kien Giang",
        openingHours: "All day",
        bestTimeToVisit: "Late afternoon for the sunset",
      },
    },
    guides: [
      {
        sectionKey: "introduction",
        title: { vi: "Giới thiệu", en: "Introduction" },
        content: {
          vi: "Bãi biển Bình San nằm sát trung tâm thành phố, nơi dòng kênh mang nước ngọt gặp biển. Bãi cát thoải, ít sóng — không gian thư giãn phù hợp để khép lại hành trình khám phá Hà Tiên.",
          en: "Binh San Beach sits right by the town centre where a freshwater canal meets the sea. Gentle sand and small waves make it a relaxing way to close your Ha Tien journey.",
        },
      },
      {
        sectionKey: "history",
        title: { vi: "Lịch sử", en: "History" },
        content: {
          vi: "Đồi Bình San phía sau bãi biển là nơi Mạc Cửu chọn làm chốn nghỉ cuối cùng — toàn cảnh bãi biển và thị xã đã chứng kiến hơn 300 năm lịch sử Hà Tiên.",
          en: "Binh San hill behind the beach is where Mac Cuu chose to rest forever — the beach and town panorama has watched over 300 years of Ha Tien history.",
        },
      },
      {
        sectionKey: "culture",
        title: { vi: "Văn hóa", en: "Culture" },
        content: {
          vi: "Chiều muộn, người dân đi dạo, tập thể dục và trẻ em đá bóng trên cát. Các gánh hàng ngọt và bắp luộc là hình ảnh quen thuộc mỗi buổi hoàng hôn.",
          en: "In the late afternoon, locals stroll, exercise and children play football on the sand. Sweet-soup and boiled-corn vendors are a familiar sunset sight.",
        },
      },
      {
        sectionKey: "interesting_facts",
        title: { vi: "Những điều thú vị", en: "Interesting facts" },
        content: {
          vi: "Đây là một trong số ít bãi biển Việt Nam mà bạn có thể vừa tắm biển, vừa nhìn thấy đồi xanh và núi đá vôi trong cùng khung hình.",
          en: "It's one of the few Vietnamese beaches where sea bathing, green hills and limestone mountains share a single frame.",
        },
      },
      {
        sectionKey: "travel_tips",
        title: { vi: "Mẹo tham quan", en: "Travel tips" },
        content: {
          vi: "Đi vào cuối chiều để tránh nắng; ghé quán nước ven đường ngắm hoàng hôn. Kết hợp thăm lăng Mạc Cửu trên đồi phía sau.",
          en: "Come in the late afternoon to avoid the heat; grab a seaside drink for the sunset, then visit Mac Cuu's mausoleum on the hill behind.",
        },
      },
    ],
    images: [
      { url: photo("bai-bien-binh-san", 1), alt: "Binh San beach" },
      { url: photo("bai-bien-binh-san", 2), alt: "Coconut palms" },
      { url: photo("bai-bien-binh-san", 3), alt: "Sunset at Binh San" },
    ],
  },
];

/** The demo tour (Plan.md §11) — a sequential route through 8 checkpoints. */
export const seedTour = {
  slug: "ha-tien-discovery",
  translations: {
    vi: {
      name: "Khám phá Hà Tiên",
      tagline: "Hành trình qua vùng đất thi ca bên vịnh Thái Lan",
      description:
        "Từ biển Mũi Nai đến rừng đá Dựng, tour đưa bạn qua 8 điểm dừng tiêu biểu nhất của Hà Tiên: biển, chùa, lăng cổ và chợ đêm — nơi khởi đầu câu chuyện Mạc Cửu mở đất hơn 300 năm trước.",
      coverImageUrl: photo("ha-tien-discovery", 1),
    },
    en: {
      name: "Ha Tien Discovery",
      tagline: "A journey through the land of poetry on the Gulf of Thailand",
      description:
        "From Mui Nai beach to the Da Dung stone forest, this tour covers Ha Tien's 8 signature stops — beaches, pagodas, historic tombs and the night market — where Mac Cuu's 300-year-old story began.",
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
    "bai-bien-binh-san",
  ],
};
