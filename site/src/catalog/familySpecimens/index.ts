import type { ComponentType } from 'react'
import type { FamilyId } from '../families'
import { BadgeSpecimens } from './BadgeSpecimens'
import { ButtonSpecimens } from './ButtonSpecimens'
import { DialogSpecimens } from './DialogSpecimens'
import { IconSpecimens } from './IconSpecimens'
import { InputSpecimens } from './InputSpecimens'
import { RadioSpecimens } from './RadioSpecimens'
import { TabsSpecimens } from './TabsSpecimens'
import { TooltipSpecimens } from './TooltipSpecimens'

/** The live specimens of each family: a new family without them is a type error. */
export const familySpecimens: Record<FamilyId, ComponentType> = {
  button: ButtonSpecimens,
  input: InputSpecimens,
  radio: RadioSpecimens,
  badge: BadgeSpecimens,
  icon: IconSpecimens,
  tabs: TabsSpecimens,
  tooltip: TooltipSpecimens,
  dialog: DialogSpecimens,
}
