import type { ComponentType } from 'react'
import type { FamilyId } from '../families'
import { AlertSpecimens } from './AlertSpecimens'
import { AvatarSpecimens } from './AvatarSpecimens'
import { BadgeSpecimens } from './BadgeSpecimens'
import { ButtonSpecimens } from './ButtonSpecimens'
import { DialogSpecimens } from './DialogSpecimens'
import { FilterChipSpecimens } from './FilterChipSpecimens'
import { IconSpecimens } from './IconSpecimens'
import { InputSpecimens } from './InputSpecimens'
import { MenuSpecimens } from './MenuSpecimens'
import { RadioSpecimens } from './RadioSpecimens'
import { SearchFieldSpecimens } from './SearchFieldSpecimens'
import { SelectSpecimens } from './SelectSpecimens'
import { TabsSpecimens } from './TabsSpecimens'
import { TooltipSpecimens } from './TooltipSpecimens'

/** The live specimens of each family: a new family without them is a type error. */
export const familySpecimens: Record<FamilyId, ComponentType> = {
  button: ButtonSpecimens,
  input: InputSpecimens,
  'search-field': SearchFieldSpecimens,
  select: SelectSpecimens,
  'filter-chip': FilterChipSpecimens,
  menu: MenuSpecimens,
  radio: RadioSpecimens,
  avatar: AvatarSpecimens,
  badge: BadgeSpecimens,
  icon: IconSpecimens,
  tabs: TabsSpecimens,
  alert: AlertSpecimens,
  tooltip: TooltipSpecimens,
  dialog: DialogSpecimens,
}
