using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceRolesTableWithEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add new integer Role column with default 6 (User)
            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 6);

            // Step 2: Migrate existing string RoleId values to integer enum values
            // UserRole: Developer=1, SuperAdmin=2, Admin=3, Support=4, Business=5, User=6
            migrationBuilder.Sql(@"
                UPDATE ""Users"" SET ""Role"" = CASE ""RoleId""
                    WHEN 'Developer'   THEN 1
                    WHEN 'Super Admin' THEN 2
                    WHEN 'Admin'       THEN 3
                    WHEN 'Support'     THEN 4
                    WHEN 'Business'    THEN 5
                    ELSE 6
                END;
            ");

            // Step 3: Assign Developer role to dmatch96@gmail.com
            migrationBuilder.Sql(@"
                UPDATE ""Users"" SET ""Role"" = 1
                WHERE ""Email"" = 'dmatch96@gmail.com';
            ");

            // Step 4: Drop FK, index, old RoleId column, and Roles table
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_RoleId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Roles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "RoleId",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name", "Order" },
                values: new object[,]
                {
                    { "Admin", "Admin", 3 },
                    { "Business", "Business", 5 },
                    { "Developer", "Developer", 1 },
                    { "Super Admin", "Super Admin", 2 },
                    { "Support", "Support", 4 },
                    { "User", "User", 6 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
