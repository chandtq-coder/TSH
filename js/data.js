// Dữ liệu tri thức rút từ giáo trình "Thần Số Học Phương Đông" (Bát tinh / 8 từ trường).
// Nội dung mang tính tham khảo văn hóa – tín ngưỡng, không có cơ sở khoa học.

export const STAR_ORDER = ["SK", "TY", "DN", "PV", "HH", "TM", "NQ", "LS"];

// base: điểm gốc của sao (dương = cát, âm = hung).
// pairs: 4 cấp năng lượng giảm dần (cấp 1–2 là "động số" mạnh, cấp 3–4 là "tĩnh số" yếu).
export const STARS = {
  SK: {
    id: "SK", name: "Sinh khí", han: "生氣", element: "Mộc", tier: "Đại cát", good: true, base: 10,
    tag: "Quý nhân · vui vẻ · tùy duyên",
    pairs: [["14", "41"], ["67", "76"], ["39", "93"], ["28", "82"]],
    uu: "Yên vui, tư duy hoạt bát, nhìn thoáng; “gặp sao yên vậy”, hay có người trợ giúp, chuyển nguy thành an.",
    khuyet: "Quá tùy duyên nên thiếu chí tiến thủ, hơi lười, ít chủ kiến; dễ bị bạn bè lôi kéo.",
    tinh: "Lạc quan, sáng sủa, thích giúp người, nhân duyên tốt, không cưỡng cầu.",
    tai: "Có quý nhân mang tài đến hoặc tiền ngoài ý muốn; nhưng hay tiêu cho bạn bè, khó giữ tiền.",
    nghiep: "Nhiều quý nhân nâng đỡ, hợp công tác xã hội, PR, quan hệ; lòng cầu tiến chưa đủ mạnh.",
    tinhcam: "Không cưỡng cầu, quan hệ hài hòa, hôn nhân êm ái.",
    khoe: "Lưu ý dạ dày, tai mắt mũi; hay chủ quan, ngại đi khám.",
    quynhan: "Quý nhân vận lớn, bằng hữu đông.",
    luuy: "Sinh khí nên nằm ở giữa dãy số để phát huy vai trò dẫn đường. Sinh khí kèm số 0 ở giữa dễ gặp tiểu nhân.",
    ve: ["Sinh khí yên vui, xuôi gió xuôi nước,", "Gặp sao yên vậy, nhìn thoáng được,", "Quý nhân phù trợ, tiền ngoài ý muốn."],
  },
  TY: {
    id: "TY", name: "Thiên y", han: "天醫", element: "Thổ", tier: "Đại cát", good: true, base: 10,
    tag: "Tài lộc · thiện lương · hôn nhân",
    pairs: [["13", "31"], ["68", "86"], ["49", "94"], ["27", "72"]],
    uu: "Thông minh, thiện lương, lòng dạ khoáng đạt, có thể thành đại sự; mang đến tài vận và hôn nhân.",
    khuyet: "Quá thiện lương, ít so đo nên dễ bị lừa; không có khái niệm tiền bạc, dễ bỏ lỡ tiểu tài.",
    tinh: "Hào phóng, đơn thuần, hay giúp người, ít tâm cơ.",
    tai: "Tiền tài đến từ bát phương, chính tài lẫn thiên tài; chi tiêu cũng tương đối hào phóng.",
    nghiep: "Có thể làm ông chủ hoặc cánh tay đắc lực; thích tôn giáo, mệnh lý, giác quan thứ sáu tốt.",
    tinhcam: "“Chính Đào hoa”: dễ gặp đối tượng tốt, tình cảm ân ái, ngọt ngào. 13/68 mạnh hơn 27/49.",
    khoe: "Lưu ý huyết áp, tuần hoàn, tai mắt mũi; không nên có quá nhiều Thiên y.",
    quynhan: "Quý nhân là bề trên hoặc bạn bè có nền tảng tốt.",
    luuy: "Thiên y nên đứng ở phía sau (hậu phương). Thiên y kèm số 0 ở giữa (103, 301…) hàm ý tình cảm kín đáo.",
    ve: ["Thiên y tài vận vượng, đơn thuần thiện lương,", "Tài lớn dễ mất tiểu tài,", "Đào hoa, huyết áp cần để tâm."],
  },
  DN: {
    id: "DN", name: "Diên niên", han: "延年", element: "Kim", tier: "Đại cát", good: true, base: 10,
    tag: "Công việc · năng lực · trách nhiệm",
    pairs: [["19", "91"], ["78", "87"], ["34", "43"], ["26", "62"]],
    uu: "Có tố chất lãnh đạo, chủ kiến, phán đoán mạnh, trách nhiệm cao, chịu áp lực tốt, thà thiếu không ẩu.",
    khuyet: "Cố chấp, khó nghe ý kiến, cái tôi lớn, hay lao tâm lao lực và để áp lực dồn lại.",
    tinh: "Mạnh mẽ, trọng nghĩa, hay đỡ đầu người yếu; ý chí kiên định.",
    tai: "Kiếm tiền vất vả nhưng giữ tiền tốt, tính toán tỉ mỉ, ít lãng phí.",
    nghiep: "Chuyên nghiệp, hợp vai trò lãnh đạo hoặc chuyên môn kỹ thuật, gánh vác một mình được một phương.",
    tinhcam: "Chuyên nhất, yêu cầu cao, thà thiếu chứ không ẩu. Giáo trình cho rằng 19/91/78/87 quá mạnh đối với nữ giới; nếu theo quan điểm này nên ưu tiên 34/43, 26/62.",
    khoe: "Chú ý vai cổ, khớp, giấc ngủ và áp lực tinh thần; nghỉ ngơi đúng mức.",
    quynhan: "Hầu như tự thân vận động, ít trông chờ quý nhân.",
    luuy: "Diên niên là sao trọng yếu nhất trong SĐT (công việc). Nên đặt ở hậu phương hoặc làm số đuôi.",
    ve: ["Diên niên từ trong xương, tự làm mọi việc tâm trách nhiệm,", "Chuyên nghiệp, có năng lực lãnh đạo,", "Quản lý tài sản chặt chẽ, thà thiếu chứ không ẩu."],
  },
  PV: {
    id: "PV", name: "Phục vị", han: "伏位", element: "Mộc", tier: "Thứ cát", good: true, base: 2,
    tag: "Ổn định · bảo thủ · chờ thời",
    pairs: [["11", "22"], ["88", "99"], ["66", "77"], ["33", "44"]],
    uu: "Sức chịu đựng và nghị lực hơn người, kiên nhẫn chờ thời “một tiếng làm kinh người”; giỏi phân tích, logic.",
    khuyet: "Bảo thủ, bị động, thiếu cảm giác an toàn, sợ mạo hiểm; làm việc lặp đi lặp lại, dễ bỏ lỡ cơ hội.",
    tinh: "Kiên nhẫn, cẩn trọng, cố chấp; nội tâm nhiều lo nghĩ.",
    tai: "Kiếm tiền hạnh khổ, thích lương cố định, thu nhập ổn định; không hợp mạo hiểm đầu tư.",
    nghiep: "Hợp công chức, đơn vị sự nghiệp, nghiên cứu, văn phòng; có thể ngồi một chỗ nhiều giờ.",
    tinhcam: "Thụ động, ít biểu đạt; cần được chủ động quan tâm, khen ngợi và trấn an.",
    khoe: "Lưu ý tim mạch, thần kinh, lo nghĩ; bệnh thường âm ỉ.",
    quynhan: "Người nhà là quý nhân tốt nhất.",
    luuy: "Phục vị làm kéo dài sao đứng trước nó. Không nên có nhiều Phục vị (177, 771…) và không nên đứng cuối với hung tinh.",
    ve: ["Phục vị quan sát thái, thiếu cảm giác an toàn nên bị động,", "Chờ thời cơ một tiếng làm kinh người,", "Cát cương cát, hung cũng hung."],
  },
  HH: {
    id: "HH", name: "Họa hại", han: "禍害", element: "Thổ", tier: "Hung (thứ hung)", good: false, base: -6,
    tag: "Khẩu tài · thị phi · nóng tính",
    pairs: [["17", "71"], ["89", "98"], ["46", "64"], ["23", "32"]],
    uu: "Miệng lưỡi lưu loát, hùng biện, thuyết phục giỏi; hợp bán hàng, giảng dạy, diễn thuyết.",
    khuyet: "Dễ cãi vã, thị phi, nóng tính, sĩ diện; khó chấp nhận thất bại, hay vì lời nói mà phá tài.",
    tinh: "Biết ăn nói, thẳng thắn, mạnh miệng, hay phàn nàn.",
    tai: "Mở miệng là có tài (nhất là khi có Thiên y) nhưng khó giữ tiền vì cãi vã, chi tiêu sĩ diện.",
    nghiep: "Nghề dùng khẩu tài: bán hàng, MC, giảng sư, luật; thích chỉ huy hơn trực tiếp làm.",
    tinhcam: "Đầu ngọt ngào, sau dễ cãi vã, hai bên mất hòa khí.",
    khoe: "Chú ý miệng, họng, khí quản, tuyến bạch huyết; sức đề kháng kém, cẩn thận khi di chuyển.",
    quynhan: "Ít quý nhân, nhiều thị phi.",
    luuy: "Dùng lời lẽ bình hòa, hài hước để hóa giải. Nên có Sinh khí đứng sau để chế hóa.",
    ve: ["Họa hại khẩu tài mạnh, thị phi cãi vã nhiều,", "Nóng tính dễ chọc giận,", "Nói chuyện ôn hòa mới hóa giải."],
  },
  TM: {
    id: "TM", name: "Tuyệt mệnh", han: "絕命", element: "Kim", tier: "Đại hung", good: false, base: -10,
    tag: "Xung động · đầu tư · cực đoan",
    pairs: [["12", "21"], ["69", "96"], ["48", "84"], ["37", "73"]],
    uu: "Phản ứng nhanh, mẫn cảm, quyết đoán, tâm địa mềm, trọng nghĩa khí, dám liều; trí nhớ và suy tính tốt.",
    khuyet: "Chấp nhất, xung động, cực đoan, khó nghe khuyên; dễ phá tài, khó giữ tiền, dễ vướng thị phi pháp lý.",
    tinh: "Thẳng tính, dễ tin bạn bè, thích độc lập; EQ chưa cao.",
    tai: "Kiếm tiền nhanh hơn người một bước nhưng giữ tiền kém. Không nên hùn vốn, cho vay.",
    nghiep: "Hợp đầu tư, tài chính, tự lập nghiệp; tinh thần mạo hiểm.",
    tinhcam: "Dũng cảm theo đuổi nhưng cân bằng kém, dễ trục trặc về sau.",
    khoe: "Chú ý gan, thận, đường tiết niệu, đường huyết; tránh làm việc quá sức.",
    quynhan: "Ít quý nhân, mọi thứ dựa vào bản thân.",
    luuy: "Tuyệt mệnh nên có Thiên y đứng sau để chế hóa (213, 968…); không nên làm số đuôi.",
    ve: ["Tuyệt mệnh xung động, đầu tư hiểm,", "Quyết đoán, thiếu cân bằng,", "Có Thiên y hóa giải mới yên."],
  },
  NQ: {
    id: "NQ", name: "Ngũ quỷ", han: "五鬼", element: "Hỏa", tier: "Đại hung", good: false, base: -9,
    tag: "Tài hoa · biến động · đa nghi",
    pairs: [["18", "81"], ["79", "97"], ["36", "63"], ["24", "42"]],
    uu: "Tài hoa, tư duy linh hoạt, phản ứng nhanh, học nhanh, hay nghĩ cách làm khác người; hợp nghệ thuật, sáng tạo.",
    khuyet: "Bất ổn, đa nghi, thiếu cảm giác an toàn, cảm xúc thất thường, nhiều toan tính.",
    tinh: "Âm thầm, độc lập, khó đoán; song trọng tính cách.",
    tai: "Tiền đến nhanh đi nhanh; hợp buôn bán, công việc biến động.",
    nghiep: "Hay đổi việc, không an phận; hợp sáng tạo, IT, nghệ thuật, công việc linh hoạt/đêm.",
    tinhcam: "Hay thay đổi, thiếu an toàn, dễ phát sinh quan hệ phức tạp.",
    khoe: "Chú ý tim mạch, tuần hoàn, thiếu ngủ do thức khuya.",
    quynhan: "Hay nghi ngờ nên khó có quý nhân.",
    luuy: "Ngũ quỷ cần Sinh khí, Thiên y, Diên niên chế hóa (141319, 14134…).",
    ve: ["Ngũ quỷ tài hoa, biến hóa đa đoan,", "Đa nghi khó an định,", "Có cát tinh chế hóa mới thành."],
  },
  LS: {
    id: "LS", name: "Lục sát", han: "六煞", element: "Thủy", tier: "Hung", good: false, base: -6,
    tag: "Tình cảm · giao tế · đào hoa",
    pairs: [["16", "61"], ["47", "74"], ["38", "83"], ["29", "92"]],
    uu: "Tình cảm phong phú, duyên với người khác giới, giao tế giỏi, thẩm mỹ tốt, khéo léo tỉ mỉ.",
    khuyet: "Do dự, đa sầu đa cảm, thiếu quyết đoán, chịu áp lực kém; tình cảm dễ rắc rối.",
    tinh: "Tinh tế, mẫn cảm, thích chưng diện, hay suy nghĩ.",
    tai: "Dựa vào quan hệ, nghề dịch vụ; tiền dễ vào nhưng dễ mất, hay tiêu cho gia đình, người thân.",
    nghiep: "Ngoại giao, dịch vụ, thẩm mỹ, làm đẹp; quan hệ xã hội tốt.",
    tinhcam: "“Thiên Đào hoa”: cưới vì tình, dễ có rắc rối trong quan hệ.",
    khoe: "Chú ý da, dạ dày, tâm trạng u buồn; nên giữ tinh thần lạc quan.",
    quynhan: "Nhiều nhân mạch nhưng ít quý nhân thật sự.",
    luuy: "Lục sát nên có Diên niên chế hóa. Lục sát + Ngũ quỷ (618, 816) dễ vướng tình cảm phức tạp.",
    ve: ["Lục sát từ trường đẹp sư ca,", "Sợ hãi tịch mịch chiêu Đào hoa,", "Tình phá tài, nát Đào hoa."],
  },
};

export const CAT = new Set(["SK", "TY", "DN"]); // đại cát
export const HUNG = new Set(["HH", "TM", "NQ", "LS"]);

// Hóa thần: sao đứng ngay sau hung tinh sẽ chế hóa hung tinh đó.
export const HEAL = {
  TM: ["TY"],
  LS: ["DN"],
  HH: ["SK", "PV"],
  NQ: ["SK", "TY", "DN"],
  PV: ["SK", "TY"],
};

// Số hậu thiên gợi ý dùng để phá giải hung tinh tiên thiên (CCCD).
export const HEAL_NUMBERS = {
  TM: ["13", "68", "49", "27"],
  LS: ["19", "87", "34", "26"],
  HH: ["114", "1414", "1419"],
  NQ: ["141319", "14134"],
  PV: ["14", "67", "39", "28", "13", "68", "49", "27"],
};

// Trọng số từng sao cho 5 lĩnh vực (quy lượng hóa mang tính minh họa từ mô tả giáo trình).
export const DOMAINS = {
  tai: { label: "Tài lộc", w: { TY: 9, SK: 3, DN: 3, PV: 1, TM: -5, NQ: -5, HH: -4, LS: -3 } },
  nghiep: { label: "Sự nghiệp", w: { DN: 9, SK: 4, TY: 4, PV: 2, TM: -2, NQ: -3, HH: -2, LS: -3 } },
  quynhan: { label: "Quý nhân", w: { SK: 9, TY: 3, DN: 1, PV: 1, TM: -3, NQ: -3, HH: -4, LS: -2 } },
  tinhcam: { label: "Tình cảm", w: { TY: 8, SK: 4, DN: 2, PV: 0, TM: -5, NQ: -6, HH: -4, LS: -6 } },
  khoe: { label: "Sức khỏe", w: { DN: 4, SK: 3, TY: 2, PV: -1, TM: -6, NQ: -5, HH: -5, LS: -4 } },
};

export const FIELD_LABELS = [
  ["uu", "Ưu điểm"], ["khuyet", "Điểm cần lưu ý"], ["tinh", "Tính cách"], ["tai", "Tài vận"],
  ["nghiep", "Sự nghiệp"], ["tinhcam", "Tình cảm – hôn nhân"], ["khoe", "Sức khỏe"], ["quynhan", "Quý nhân"],
  ["luuy", "Lưu ý vị trí"],
];

// Tổ hợp hai từ trường liền kề: COMBOS[trước][sau] (giáo trình tr.58–61: tiêu đề là sao đứng sau).
export const COMBOS = {
  SK: {
    SK: "Quý nhân tụ tập, năng lượng quý nhân được tăng cường.",
    TY: "Quý nhân mang tài phú đến.",
    DN: "Quý nhân giúp có công việc tốt, lợi học hành, thăng tiến; hợp vai trò lãnh đạo, thầy cô.",
    PV: "Từ trường Sinh khí được kéo dài, càng hữu lực.",
    HH: "Tự nhận mình rất giỏi, nói ra dễ dẫn đến tranh luận.",
    TM: "Rất vui vẻ phấn đấu vì mộng tưởng lớn, nhưng chưa chắc thực hiện được.",
    NQ: "Khéo léo đưa đẩy.",
    LS: "Khéo léo trong giao tiếp.",
  },
  TY: {
    SK: "Hào phóng với bạn bè, nhân duyên tốt, tốn không ít tiền cho bạn bè.",
    TY: "Tài phú được tăng cường, còn có hiện tượng hôn nhân.",
    DN: "Có ý tự làm chủ, giỏi đầu tư lập nghiệp.",
    PV: "Từ trường Thiên y được kéo dài.",
    HH: "Thích tiêu tiền, sĩ diện, thích ăn uống, thích lấy lòng người.",
    TM: "Có tiền đem đi đầu tư, suy nghĩ chưa chặt chẽ nên dễ hao tài.",
    NQ: "Suy nghĩ chưa chắc chắn mà hao tài.",
    LS: "Dễ vì chuyện tình cảm, người khác giới mà hao tài; ảnh hưởng hôn nhân.",
  },
  DN: {
    SK: "Công việc vui vẻ, ít áp lực; lợi cho học hành.",
    TY: "Dựa vào năng lực kiếm tiền. Diên lớn Thiên nhỏ thì vất vả ít thu hoạch; Diên nhỏ Thiên lớn thì nhẹ nhàng kiếm nhiều.",
    DN: "Năng lực làm việc mạnh, có quyền lợi, có tố chất lãnh đạo.",
    PV: "Cố gắng làm việc nhưng thiên về bị động; từ trường Diên niên được kéo dài.",
    HH: "Dễ có lời ra tiếng vào, năng lực lãnh đạo bị cản trở; làm việc dễ hối hận.",
    TM: "Không muốn làm việc, công việc nhiều trắc trở; tình cảm, quan hệ nhân mạch chưa tốt.",
    NQ: "Công việc vừa làm vừa nghĩ biến báo; có thể biến động trong công tác.",
    LS: "Công việc không vui, hay u buồn, thiếu quả quyết.",
  },
  PV: {
    SK: "Tích thế cho Sinh khí, năng lượng Sinh khí càng cường đại hữu lực.",
    TY: "Kiên nhẫn chờ đợi mà tạo ra tài phú lớn.",
    DN: "Tích thế cho Diên niên, năng lượng càng mạnh, có quyền lợi.",
    PV: "Vận sức chờ phát động, thế lực Phục vị tăng mạnh.",
    HH: "Mạnh miệng, tự cho mình là đúng.",
    TM: "Tích thế xung động: không xung thì thôi, đã xung là lao lên rất liều.",
    NQ: "Tích thế cho Ngũ quỷ, đa nghi, bất an kéo dài.",
    LS: "Tích thế cho Lục sát: do dự kéo dài, thêm “sợ khó”.",
  },
  HH: {
    SK: "Khẩu tài tốt, lời nói có trọng lượng, người khác dễ nghe.",
    TY: "Kiếm tiền bằng khẩu tài: bán hàng, diễn thuyết.",
    DN: "Công việc dựa vào khẩu tài; có năng lực, nói giỏi, lấy miệng làm nghề.",
    PV: "Từ trường Họa hại được kéo dài.",
    HH: "Nói thẳng, dễ cãi vã, mạnh miệng, nóng tính, kém kiên nhẫn.",
    TM: "Nói chuyện rất xung động, dễ tổn thương người khác; đầu tư dễ thất bại.",
    NQ: "Cách biểu đạt kỳ lạ khiến người khác khó hiểu.",
    LS: "Nói ra không cần được đáp lại, khiến người nghe buồn bực.",
  },
  TM: {
    SK: "Rất vui vẻ.",
    TY: "Kiếm tiền nhờ cố gắng phấn đấu, hoặc đầu tư, quản lý tài sản.",
    DN: "Công việc gan lớn, dám liều: kinh doanh, đầu tư, quản lý tài sản.",
    PV: "Từ trường Tuyệt mệnh được kéo dài.",
    HH: "Cách làm việc dễ gây cãi vã, đầu tư dễ thất bại; nên thận trọng khi di chuyển.",
    TM: "Chủ quan, kích động, cực đoan, dễ hao tài; không hợp cờ bạc, khó quản lý tài sản.",
    NQ: "Rất xung động, ý nghĩ kỳ lạ; nên tránh quyết định liều lĩnh.",
    LS: "Cảm giác vất vả, cố gắng và bị ép buộc; dễ u buồn.",
  },
  NQ: {
    SK: "Động não, nghĩ ra ý tưởng tốt, phương án hữu dụng.",
    TY: "Kiếm tiền nhờ ý tưởng tài hoa; công việc cần linh hoạt trí óc.",
    DN: "Công việc cần cường độ hoạt động trí óc cao, linh hoạt.",
    PV: "Từ trường Ngũ quỷ được kéo dài.",
    HH: "Suy nghĩ dễ gây ra cãi vã.",
    TM: "Có tin tốt liền nắm lấy và cố gắng thực hiện; dám liều.",
    NQ: "Tài hoa nhất cũng bất ổn nhất; phản ứng nhanh nhưng dễ gặp trắc trở, ý nghĩ hay đổi.",
    LS: "Ý nghĩ buồn bực, ít tác dụng; dễ vướng chuyện tình cảm khác thường.",
  },
  LS: {
    SK: "Nhân duyên tốt, nhiệt tình, quan hệ xã hội tốt.",
    TY: "Kiếm tiền qua ngành dịch vụ; cần công việc tỉ mỉ.",
    DN: "Hành chính, dịch vụ; khéo xử lý quan hệ xã hội.",
    PV: "Từ trường Lục sát được kéo dài.",
    HH: "Không có tâm tình nói chuyện, dễ vô tình đắc tội người khác.",
    TM: "Có cảm xúc vất vả, cố gắng và bị ép buộc.",
    NQ: "Cảm xúc biến hóa vô hạn, thiếu cảm giác an toàn.",
    LS: "Tăng u buồn, cảm xúc bất ổn, quan hệ dễ chuyển biến bất ngờ; thiên Đào hoa.",
  },
};

// Các chuỗi chữ số đặc biệt nêu trong giáo trình.
export const PATTERNS = [
  { re: /(103|301|608|806)/g, tone: "warn", title: "Chuỗi 103 / 301 / 608 / 806", text: "Theo giáo trình: Thiên y/Họa hại kèm số 0 ở giữa hàm ý tình cảm kín đáo, khó nhìn thấy; nên giữ minh bạch trong các mối quan hệ." },
  { re: /(218|812)/g, tone: "warn", title: "Chuỗi 218 / 812 (Tuyệt mệnh + Ngũ quỷ)", text: "Tổ hợp hai hung tinh mạnh; giáo trình khuyên chú ý sức khỏe, nghỉ ngơi điều độ và khám định kỳ." },
  { re: /(618|816)/g, tone: "warn", title: "Chuỗi 618 / 816 (Lục sát + Ngũ quỷ)", text: "Dễ vướng chuyện tình cảm phức tạp; nên giữ sự rõ ràng, chân thành." },
  { re: /(177|771)/g, tone: "warn", title: "Chuỗi 177 / 771 (Phục vị chồng Họa hại)", text: "Phục vị làm kéo dài hung tinh, giáo trình không khuyến khích." },
];

export const CARRIER_NOTE = "Bảng đầu số là dữ liệu cấu hình (js/carriers.js), có thể thay đổi theo quy hoạch của Bộ TT&TT.";

// Mã tỉnh/thành trên CCCD 12 số (theo tên đơn vị hành chính trước khi sáp nhập).
export const PROVINCES = {
  "001": "Hà Nội", "002": "Hà Giang", "004": "Cao Bằng", "006": "Bắc Kạn", "008": "Tuyên Quang", "010": "Lào Cai",
  "011": "Điện Biên", "012": "Lai Châu", "014": "Sơn La", "015": "Yên Bái", "017": "Hòa Bình", "019": "Thái Nguyên",
  "020": "Lạng Sơn", "022": "Quảng Ninh", "024": "Bắc Giang", "025": "Phú Thọ", "026": "Vĩnh Phúc", "027": "Bắc Ninh",
  "030": "Hải Dương", "031": "Hải Phòng", "033": "Hưng Yên", "034": "Thái Bình", "035": "Hà Nam", "036": "Nam Định",
  "037": "Ninh Bình", "038": "Thanh Hóa", "040": "Nghệ An", "042": "Hà Tĩnh", "044": "Quảng Bình", "045": "Quảng Trị",
  "046": "Thừa Thiên Huế", "048": "Đà Nẵng", "049": "Quảng Nam", "051": "Quảng Ngãi", "052": "Bình Định", "054": "Phú Yên",
  "056": "Khánh Hòa", "058": "Ninh Thuận", "060": "Bình Thuận", "062": "Kon Tum", "064": "Gia Lai", "066": "Đắk Lắk",
  "067": "Đắk Nông", "068": "Lâm Đồng", "070": "Bình Phước", "072": "Tây Ninh", "074": "Bình Dương", "075": "Đồng Nai",
  "077": "Bà Rịa - Vũng Tàu", "079": "TP. Hồ Chí Minh", "080": "Long An", "082": "Tiền Giang", "083": "Bến Tre",
  "084": "Trà Vinh", "086": "Vĩnh Long", "087": "Đồng Tháp", "089": "An Giang", "091": "Kiên Giang", "092": "Cần Thơ",
  "093": "Hậu Giang", "094": "Sóc Trăng", "095": "Bạc Liêu", "096": "Cà Mau",
};
