import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum UserRole {
  Customer = 'customer',
  Admin = 'admin',
  Staff = 'staff',
  Guest = 'guest',
}

export enum UserStatus {
  Active = 'active',
  Blocked = 'blocked',
  Deleted = 'deleted',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true, lowercase: true, trim: true })
  email: string

  @Prop({ required: true })
  passwordHash: string

  @Prop({
    type: [String],
    enum: UserRole,
    default: [UserRole.Guest],
  })
  roles: UserRole[]

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.Active,
  })
  status: UserStatus

  @Prop()
  phone?: string

  @Prop()
  avatarUrl?: string

  @Prop()
  defaultAddressId?: string
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ roles: 1 })
UserSchema.index({ status: 1 })
