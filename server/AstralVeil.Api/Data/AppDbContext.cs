using AstralVeil.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AstralVeil.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<HoroscopeDailyEntity> HoroscopeDailies => Set<HoroscopeDailyEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>(e =>
        {
            e.HasKey(x => x.Phone);
            e.Property(x => x.Phone).HasMaxLength(16);
            e.Property(x => x.Nickname).HasMaxLength(128);
            e.Property(x => x.ZodiacId).HasMaxLength(32);
        });

        modelBuilder.Entity<HoroscopeDailyEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Phone).HasMaxLength(16);
            e.Property(x => x.DateIso).HasMaxLength(10);
            e.HasIndex(x => new { x.Phone, x.DateIso }).IsUnique();
        });
    }
}
