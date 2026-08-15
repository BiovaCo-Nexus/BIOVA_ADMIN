-- ==============================================================================
-- BIOVACO NEXUS ENTERPRISE ERP - REWARD WITHDRAWALS & PAYOUTS LEDGER SCHEMA
-- ==============================================================================
-- Table for tracking performance points reward withdrawals, payout claims,
-- transaction IDs (UTR), payment modes, and CEO disbursement timestamps.

CREATE TABLE IF NOT EXISTS public.reward_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    points NUMERIC(10, 2) NOT NULL CHECK (points > 0),
    payment_method TEXT NOT NULL,           -- e.g. 'UPI', 'Bank Transfer', 'Other'
    payment_details TEXT NOT NULL,          -- e.g. 'member@okhdfcbank' or Account/IFSC
    notes TEXT,                             -- Member notes during claim
    status TEXT NOT NULL DEFAULT 'pending'  -- 'pending' | 'approved' | 'paid' | 'rejected'
        CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    
    -- CEO / Admin Payout Settlement Fields
    transaction_id TEXT,                    -- UTR / Bank Reference No (e.g. 'UPI423589123456')
    payment_mode_used TEXT,                 -- e.g. 'UPI Transfer', 'Bank IMPS Transfer'
    admin_notes TEXT,                       -- Finance / CEO remarks
    processed_at TIMESTAMPTZ,               -- When CEO marked as Paid / Rejected
    
    -- Member Follow-up & Reminder Tracking
    last_reminded_at TIMESTAMPTZ,           -- When member clicked 'Remind CEO'
    reminder_count INT DEFAULT 0,           -- Number of reminders sent
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING & LEADERBOARD AGGREGATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_reward_withdrawals_user_email ON public.reward_withdrawals (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_reward_withdrawals_status ON public.reward_withdrawals (status);
CREATE INDEX IF NOT EXISTS idx_reward_withdrawals_created_at ON public.reward_withdrawals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_withdrawals_txn_id ON public.reward_withdrawals (transaction_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.reward_withdrawals ENABLE ROW LEVEL SECURITY;

-- 1. Members can view their own claims; Executives (CEO/MD) can view all claims
CREATE POLICY "Users can view own claims or executive view all"
    ON public.reward_withdrawals
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' = lower(user_email)
        OR auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in', 'nakul@biovaco.in', 'admin@biovaco.in')
    );

-- 2. Authenticated users can insert their own claims
CREATE POLICY "Users can submit own withdrawal claims"
    ON public.reward_withdrawals
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' = lower(user_email)
        OR auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in', 'nakul@biovaco.in', 'admin@biovaco.in')
    );

-- 3. Only Executives / Admins can update payout status (Mark Paid / Reject)
CREATE POLICY "Executives can update claims status and payouts"
    ON public.reward_withdrawals
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in', 'nakul@biovaco.in', 'admin@biovaco.in')
    );

-- ==============================================================================
-- AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_reward_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reward_withdrawals_updated_at ON public.reward_withdrawals;
CREATE TRIGGER trg_reward_withdrawals_updated_at
    BEFORE UPDATE ON public.reward_withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_reward_withdrawals_updated_at();
