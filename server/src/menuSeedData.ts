/**
 * Service menu (price list) — prices in cents; "& UP" items use the starting price.
 * Duration is an estimate for booking slots (minutes).
 */
type MenuServiceSeed = {
  category: string
  name: string
  description: string
  priceCents: number
  durationMinutes: number
  sortOrder: number
  imageUrl?: string
  noPhoto?: boolean
  active?: boolean
}

const FROM_DESC = 'Starting price; final price may vary.'
const DEFAULT_DESC = 'Book this service online or call the salon.'

function buildMenu(): MenuServiceSeed[] {
  const rows: MenuServiceSeed[] = []
  let order = 0
  const add = (
    category: string,
    name: string,
    dollars: number,
    durationMinutes: number,
    opts?: { from?: boolean; desc?: string }
  ) => {
    order += 1
    const desc = opts?.desc ?? (opts?.from ? FROM_DESC : DEFAULT_DESC)
    rows.push({
      category,
      name,
      description: desc.trim(),
      priceCents: Math.round(dollars * 100),
      durationMinutes,
      sortOrder: order,
      imageUrl: '',
      noPhoto: true,
      active: true,
    })
  }

  // 1. Threading
  add('Threading', 'Eye-brow', 13, 20)
  add('Threading', 'Lip', 8, 15)
  add('Threading', 'Chin', 5, 15, { from: true })
  add('Threading', 'Sideburns', 8, 20, { from: true })
  add('Threading', 'Forehead', 5, 15)
  add('Threading', 'Face Threading', 35, 45, { from: true })
  add('Threading', 'Full Cheeks', 25, 30, { from: true })
  add('Threading', 'Eyebrows Tinting', 20, 25)

  // 2. Body Waxing
  add('Body Waxing', 'Eyebrow Wax', 15, 20)
  add('Body Waxing', 'Upper Lips Wax', 10, 15)
  add('Body Waxing', 'Face Waxing', 40, 35, { from: true })
  add('Body Waxing', 'Under Arms', 15, 20, { from: true })
  add('Body Waxing', 'Full Arms', 30, 30, { from: true })
  add('Body Waxing', 'Half Arms', 18, 25, { from: true })
  add('Body Waxing', 'Half Legs', 30, 30)
  add('Body Waxing', 'Full Legs', 40, 40, { from: true })
  add('Body Waxing', '3/4 Legs', 35, 35)
  add('Body Waxing', 'Full Backs', 30, 35, { from: true })
  add('Body Waxing', 'Stomach', 25, 25, { from: true })
  add('Body Waxing', 'Bikini Wax', 55, 35, { from: true })
  add('Body Waxing', 'Nose Waxing', 10, 15, { from: true })
  add('Body Waxing', 'Ear Waxing', 10, 15)
  add('Body Waxing', 'Sideburn Wax', 10, 15, { from: true })
  add('Body Waxing', 'Chest Wax', 20, 25, { from: true })
  add('Body Waxing', 'Butt Wax', 25, 25, { from: true })

  // 3. Bleach
  add('Bleach', 'Face Bleach', 20, 35)
  add('Bleach', 'Face Bleach Silver', 25, 35, {
    desc: 'Silver/bleach facial treatment. Book online or call the salon.',
  })
  add('Bleach', 'Full Back Bleach', 40, 45)
  add('Bleach', 'Half Back Bleach', 30, 35)

  // 4. Men's color / cut (menu heading)
  add("Men's color & cut", 'Men Color', 30, 50, { from: true })
  add("Men's color & cut", 'Men Cut', 25, 40, { from: true })

  // 5. Facial
  add('Facial', 'Shahnaz Facial', 65, 75)
  add('Facial', 'Lotus Facial', 60, 70)
  add('Facial', 'O3+ Facial', 70, 75)
  add('Facial', 'O3+ D-Tan Mask', 20, 25)
  add('Facial', 'Pigmentation Facial', 60, 70, { from: true })
  add('Facial', 'Bridal Facial', 80, 90, { from: true })
  add('Facial', 'Fruit Facial', 45, 55, { from: true })
  add('Facial', 'Mini Facial (30 Minutes)', 45, 30)
  add('Facial', 'Cleaning Facial', 25, 40, { from: true })
  add('Facial', 'Body D-Tan Facial', 60, 70, { from: true })
  add('Facial', 'Body Shiner Facial', 60, 70, { from: true })

  // 6. Hair Care
  add('Hair Care', 'All Advance Hair Cut', 35, 45, { from: true })
  add('Hair Care', 'U-Cut', 20, 35, { from: true })
  add('Hair Care', 'Straight Trim', 15, 25, { from: true })
  add('Hair Care', 'Bangs Trim', 5, 15, { from: true })
  add('Hair Care', 'Hair Henna (According to Hair Length)', 25, 60, {
    from: true,
    desc:
      'Priced by hair length. Differing hair length & growth may affect price. ' + FROM_DESC,
  })
  add('Hair Care', 'Hair Henna w/Wash', 40, 75, { from: true })
  add('Hair Care', 'Black Henna', 25, 60, { from: true })
  add('Hair Care', 'Hair Spa', 45, 60, { from: true })
  add('Hair Care', 'Deep Conditioning Treatment', 45, 45, { from: true })
  add('Hair Care', 'Hot Oil Scalp Massage', 45, 45, { from: true })
  add('Hair Care', 'Hair Wash Only', 15, 25, { from: true })
  add('Hair Care', 'Hair Wash Blowdry', 25, 35, { from: true })
  add('Hair Care', 'Hair Straightening', 25, 45, { from: true })
  add('Hair Care', 'Root Touch Up', 35, 60, { from: true })
  add('Hair Care', 'All Over Scalp to Ends', 50, 90, { from: true })
  add('Hair Care', 'Color & Cut', 60, 90, { from: true })
  add('Hair Care', 'Highlights', 75, 120, { from: true })
  add('Hair Care', 'Own Color Application', 25, 45, { from: true })

  // 7. Hair Styles & Makeup
  add('Hair Styles & Makeup', 'Hair Styles & Makeup', 100, 90, { from: true })
  add('Hair Styles & Makeup', 'Hairstyles, Makeup & Sari Wrap', 150, 120, { from: true })
  add('Hair Styles & Makeup', 'Henna Tattoo', 10, 30, { from: true })

  return rows
}

export const MENU_SERVICES: MenuServiceSeed[] = buildMenu()
