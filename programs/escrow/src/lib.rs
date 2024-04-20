use anchor_lang::prelude::*;

declare_id!("8M9LfcnALo4WNqGmoUkwtKvZVutkkUeje5kMWJnT6wQQ");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
