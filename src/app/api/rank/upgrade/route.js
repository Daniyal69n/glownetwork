import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { verifyToken } from '../../../../../lib/auth';

const RANK_REQUIREMENTS = {
  'Assistant': {
    next: 'Manager',
    requirement: 50000 // ₨50k referral value
  },
  'Manager': {
    next: 'S.Manager',
    requirement: 100000 // ₨100k referral value
  },
  'S.Manager': {
    next: 'D.Manager',
    teamRequirement: { rank: 'S.Manager', count: 5 } // Only 5 S.Managers in downline
  },
  'D.Manager': {
    next: 'G.Manager',
    teamRequirement: { rank: 'D.Manager', count: 5 } // Only 5 D.Managers in downline
  },
  'G.Manager': {
    next: 'Director',
    teamRequirement: { rank: 'G.Manager', count: 4 } // Only 4 G.Managers in downline
  }
};

export async function POST(request) {
  try {
    await dbConnect();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.rank) {
      return NextResponse.json({ error: 'User not found or no rank assigned' }, { status: 404 });
    }

    const currentRank = user.rank;
    const rankConfig = RANK_REQUIREMENTS[currentRank];

    if (!rankConfig) {
      return NextResponse.json({ error: 'Maximum rank reached' }, { status: 400 });
    }

    // Check referral value requirement (only for Assistant and Manager ranks)
    // Fallback: if totalReferralValue wasn't backfilled yet, derive from directReferrals
    let currentReferralValue = user.totalReferralValue || 0;
    if (currentReferralValue < (rankConfig.requirement || 0)) {
      const derivedReferralValue = (user.directReferrals || []).reduce((sum, r) => sum + (r.packageValue || 0), 0);
      currentReferralValue = Math.max(currentReferralValue, derivedReferralValue);
    }

    // TEMPORARY FIX: If no referral data found, check for approved packages by referred users
    if (currentReferralValue < (rankConfig.requirement || 0)) {
      const referredUsers = await User.find({ referredBy: user.referralCode });
      let approvedReferralValue = 0;
      for (const referredUser of referredUsers) {
        // Count any package amount (including delivery charges)
        if (referredUser.packagePurchased && referredUser.packagePurchaseDate) {
          approvedReferralValue += referredUser.packagePurchased;
        }
      }
      if (approvedReferralValue > 0) {
        // Update user's referral data
        user.totalReferralValue = approvedReferralValue;
        if (!Array.isArray(user.directReferrals)) {
          user.directReferrals = [];
        }
        // Add missing direct referral entries
        for (const referredUser of referredUsers) {
          if (referredUser.packagePurchased && referredUser.packagePurchaseDate) {
            const alreadyExists = user.directReferrals.some(r => String(r.userId) === String(referredUser._id));
            if (!alreadyExists) {
              user.directReferrals.push({
                userId: referredUser._id,
                packageValue: referredUser.packagePurchased,
                purchaseDate: referredUser.packagePurchaseDate
              });
            }
          }
        }
        await user.save();
        currentReferralValue = approvedReferralValue;
      }
    }

    if (rankConfig.requirement && currentReferralValue < rankConfig.requirement) {
      console.log('Rank upgrade blocked:', {
        currentRank: user.rank,
        targetRank: rankConfig.next,
        required: rankConfig.requirement,
        currentValue: currentReferralValue,
        totalReferralValue: user.totalReferralValue,
        directReferrals: user.directReferrals?.length || 0,
        directReferralsSum: (user.directReferrals || []).reduce((sum, r) => sum + (r.packageValue || 0), 0)
      });
      return NextResponse.json({
        error: `Insufficient referral value. Required: ₨${rankConfig.requirement.toLocaleString()}, Current: ₨${currentReferralValue.toLocaleString()}`
      }, { status: 400 });
    }

    // Check team requirement for higher ranks
    if (rankConfig.teamRequirement) {
      const teamCount = await countTeamMembers(user._id, rankConfig.teamRequirement.rank);
      console.log(`Rank upgrade check for ${user.username}:`, {
        currentRank: user.rank,
        targetRank: rankConfig.next,
        requiredTeamRank: rankConfig.teamRequirement.rank,
        requiredCount: rankConfig.teamRequirement.count,
        actualCount: teamCount,
        userReferralCode: user.referralCode
      });
      
      if (teamCount < rankConfig.teamRequirement.count) {
        return NextResponse.json({
          error: `Insufficient team members. Required: ${rankConfig.teamRequirement.count} ${rankConfig.teamRequirement.rank}s, Current: ${teamCount}`
        }, { status: 400 });
      }
    }

    // Upgrade rank
    user.rank = rankConfig.next;
    await user.save();

    return NextResponse.json({
      message: `Rank upgraded to ${rankConfig.next} successfully`,
      newRank: rankConfig.next
    });

  } catch (error) {
    console.error('Rank upgrade error:', error);
    console.error('Error stack:', error.stack);
    console.error('User data:', { 
      userId: decoded?.userId, 
      rank: user?.rank, 
      totalReferralValue: user?.totalReferralValue,
      directReferrals: user?.directReferrals?.length || 0
    });
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

async function countTeamMembers(userId, targetRank) {
  try {
    // Get all users referred by this user (direct and indirect)
    const user = await User.findById(userId);
    if (!user) return 0;

    const teamMembers = await getTeamMembers(user.referralCode);
    const targetRankMembers = teamMembers.filter(member => member.rank === targetRank);
    
    console.log(`Team analysis for user ${user.username} (${user.referralCode}):`, {
      totalTeamMembers: teamMembers.length,
      targetRank,
      targetRankCount: targetRankMembers.length,
      allRanks: teamMembers.map(m => ({ username: m.username, rank: m.rank }))
    });
    
    return targetRankMembers.length;
  } catch (error) {
    console.error('Error counting team members:', error);
    return 0;
  }
}

async function getTeamMembers(referralCode, visited = new Set()) {
  if (visited.has(referralCode)) return [];
  visited.add(referralCode);

  const directReferrals = await User.find({ referredBy: referralCode });
  let allMembers = [...directReferrals];

  for (const member of directReferrals) {
    const indirectMembers = await getTeamMembers(member.referralCode, visited);
    allMembers = allMembers.concat(indirectMembers);
  }

  return allMembers;
}
