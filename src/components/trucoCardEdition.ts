import sheet1 from "../assets/truco-cards/edition-20261105/01.webp";
import sheet2 from "../assets/truco-cards/edition-20261105/02.webp";
import sheet3 from "../assets/truco-cards/edition-20261105/03.webp";
import sheet4 from "../assets/truco-cards/edition-20261105/04.webp";
import sheet5 from "../assets/truco-cards/edition-20261105/05.webp";
import sheet6 from "../assets/truco-cards/edition-20261105/06.webp";
import sheet7 from "../assets/truco-cards/edition-20261105/07.webp";
import sheet10 from "../assets/truco-cards/edition-20261105/10.webp";
import sheet11 from "../assets/truco-cards/edition-20261105/11.webp";
import sheet12 from "../assets/truco-cards/edition-20261105/12.webp";
import back from "../assets/truco-cards/edition-20261105/back.webp";
export type CardCrop = readonly [number,number,number,number];
export type CardSheet = {src:string;size:readonly [number,number];boxes:readonly CardCrop[]};
export const TRUCO_EDITION:Record<number,CardSheet> = {
  1: {src: sheet1, size: [2167, 726], boxes: [[29, 24, 496, 674], [567, 24, 496, 674], [1104, 24, 496, 674], [1644, 24, 496, 674]]},
  2: {src: sheet2, size: [2172, 724], boxes: [[27, 24, 493, 673], [570, 24, 493, 673], [1112, 24, 493, 673], [1655, 24, 493, 673]]},
  3: {src: sheet3, size: [2172, 724], boxes: [[56, 29, 480, 665], [583, 29, 481, 665], [1109, 29, 479, 665], [1637, 29, 480, 665]]},
  4: {src: sheet4, size: [2172, 724], boxes: [[24, 25, 495, 671], [567, 25, 494, 671], [1110, 25, 494, 671], [1653, 25, 495, 671]]},
  5: {src: sheet5, size: [2172, 724], boxes: [[59, 29, 479, 665], [584, 29, 479, 664], [1108, 29, 480, 665], [1634, 29, 479, 665]]},
  6: {src: sheet6, size: [2172, 724], boxes: [[46, 23, 474, 672], [582, 23, 474, 672], [1117, 23, 474, 672], [1652, 23, 475, 672]]},
  7: {src: sheet7, size: [2172, 724], boxes: [[28, 21, 499, 680], [567, 21, 501, 680], [1106, 21, 501, 680], [1645, 21, 501, 680]]},
  10: {src: sheet10, size: [2172, 724], boxes: [[46, 27, 481, 664], [580, 27, 482, 664], [1110, 27, 483, 664], [1646, 27, 481, 664]]},
  11: {src: sheet11, size: [2172, 724], boxes: [[38, 20, 489, 682], [574, 20, 488, 681], [1110, 20, 488, 681], [1647, 20, 487, 681]]},
  12: {src: sheet12, size: [2172, 724], boxes: [[28, 24, 491, 671], [570, 24, 491, 671], [1112, 24, 490, 671], [1653, 24, 491, 671]]}
};
export const TRUCO_BACK = {src:back,size:[1024,1536] as const,box:[76,125,872,1248] as const};
