-- No suggested spend per child unless the owner sets one.
ALTER TABLE "Season" ALTER COLUMN "perChildBudgetCents" DROP NOT NULL,
ALTER COLUMN "perChildBudgetCents" DROP DEFAULT;
