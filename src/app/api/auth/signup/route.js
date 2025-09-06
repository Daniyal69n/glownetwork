import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { hashPassword, generateReferralCode } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { username, email, phone, password, referralCode } = await request.json();

    // Normalize inputs
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPhoneRaw = typeof phone === 'string' || typeof phone === 'number' ? String(phone) : '';
    const normalizedPhone = normalizedPhoneRaw.trim();
    const normalizedReferralCode = typeof referralCode === 'string' ? referralCode.trim() : '';

    // Validate required fields
    if (!normalizedUsername || !normalizedEmail || !normalizedPhone || !password) {
      return NextResponse.json(
        { error: 'Username, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phone: normalizedPhone }, { username: normalizedUsername }, { email: normalizedEmail }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email, phone or username already exists' },
        { status: 400 }
      );
    }

    // Validate referral code if provided
    let referredBy = null;
    if (normalizedReferralCode) {
      const referrer = await User.findOne({ referralCode: normalizedReferralCode });
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }
      referredBy = normalizedReferralCode;
    }

    // Generate unique referral code for new user
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = generateReferralCode();
      const existing = await User.findOne({ referralCode: newReferralCode });
      if (!existing) {
        isUnique = true;
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy
    });

    await newUser.save();

    return NextResponse.json(
      { 
        message: 'User created successfully',
        referralCode: newReferralCode
      },
      { status: 201 }
    );

  } catch (error) {
    // Handle duplicate key errors from MongoDB (race conditions or index-level checks)
    if (error && (error.code === 11000 || error.name === 'MongoServerError' && error.message.includes('E11000'))) {
      return NextResponse.json(
        { error: 'User with this email, phone or username already exists' },
        { status: 400 }
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
